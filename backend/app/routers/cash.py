"""
現金管理 ルーター

入金・出金の処理
"""

from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import Asset
from app.schemas.asset import AssetResponse, CashTransactionRequest

cash_router = APIRouter(
    prefix="/api/cash",
    tags=["現金管理"],
)

# 現金カテゴリID
CASH_CATEGORY_ID = 4


@cash_router.post(
    "/transaction",
    response_model=AssetResponse,
    status_code=200,
    summary="現金入出金",
    description="現金の入金または出金を処理します。",
)
async def cash_transaction(
    transaction: CashTransactionRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    現金の入出金を処理。

    Args:
        transaction: 入出金データ（amount, transaction_type）

    Returns:
        更新された現金資産情報
    """
    # 現金資産を取得または作成
    result = await db.execute(
        select(Asset)
        .options(selectinload(Asset.category))
        .where(Asset.category_id == CASH_CATEGORY_ID)
    )
    cash_asset = result.scalar_one_or_none()

    amount = transaction.amount.quantize(Decimal("0.01"))

    if transaction.transaction_type == "deposit":
        # 入金
        if cash_asset:
            cash_asset.quantity = (cash_asset.quantity + amount).quantize(Decimal("0.01"))
            cash_asset.current_value = cash_asset.quantity
        else:
            # 現金資産が存在しない場合は作成
            cash_asset = Asset(
                category_id=CASH_CATEGORY_ID,
                name="現金",
                ticker_symbol=None,
                quantity=amount,
                average_cost=Decimal("1"),
                current_price=Decimal("1"),
                current_value=amount,
                currency="JPY",
            )
            db.add(cash_asset)
    elif transaction.transaction_type == "withdraw":
        # 出金
        if not cash_asset or cash_asset.quantity < amount:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"残高不足です。現在の残高: ¥{cash_asset.quantity if cash_asset else 0:,.0f}"
                ),
            )
        cash_asset.quantity = (cash_asset.quantity - amount).quantize(Decimal("0.01"))
        cash_asset.current_value = cash_asset.quantity
    else:
        raise HTTPException(
            status_code=400,
            detail="transaction_type は 'deposit' または 'withdraw' を指定してください",
        )

    await db.commit()

    # 再取得してレスポンス
    result = await db.execute(
        select(Asset).options(selectinload(Asset.category)).where(Asset.id == cash_asset.id)
    )
    return result.scalar_one()


@cash_router.get(
    "/balance",
    response_model=dict,
    summary="現金残高取得",
    description="現在の現金残高を取得します。",
)
async def get_cash_balance(db: AsyncSession = Depends(get_db)):
    """
    現金残高を取得。

    Returns:
        現金残高
    """
    result = await db.execute(select(Asset).where(Asset.category_id == CASH_CATEGORY_ID))
    cash_asset = result.scalar_one_or_none()

    balance = cash_asset.quantity if cash_asset else Decimal("0")
    return {"balance": balance, "currency": "JPY"}
