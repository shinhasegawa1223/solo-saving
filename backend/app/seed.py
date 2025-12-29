"""
Seed script to populate database with initial/demo data.
Run this after migrations to set up demo data matching frontend mockData.
"""

import asyncio
from datetime import date, timedelta
from decimal import Decimal

from sqlalchemy import select

from app.database import async_session_maker
from app.models import AssetSnapshot, SavingsGoal


async def seed_savings_goals():
    """Seed savings goals matching appConfig.json."""
    async with async_session_maker() as session:
        # Check if already seeded
        result = await session.execute(select(SavingsGoal))
        existing = result.scalars().first()
        if existing:
            print("Savings goals already seeded, skipping...")
            return

        goal = SavingsGoal(
            label="目標資産額",
            target_amount=Decimal("10000000"),
            current_amount=Decimal("4610000"),
            is_active=True,
        )
        session.add(goal)
        await session.commit()
        print("✓ Seeded savings goals")


async def seed_asset_snapshots():
    """Seed asset snapshots matching mockData.ts."""
    async with async_session_maker() as session:
        # Check if already seeded
        result = await session.execute(select(AssetSnapshot))
        existing = result.scalars().first()
        if existing:
            print("Asset snapshots already seeded, skipping...")
            return

        # Monthly data from mockData.ts (2024年のデータとして)
        monthly_data = [
            {
                "month": 1,
                "日本株": 890000,
                "米国株": 1200000,
                "投資信託": 800000,
                "現金": 500000,
            },
            {
                "month": 2,
                "日本株": 920000,
                "米国株": 1150000,
                "投資信託": 820000,
                "現金": 510000,
            },
            {
                "month": 3,
                "日本株": 980000,
                "米国株": 1300000,
                "投資信託": 850000,
                "現金": 520000,
            },
            {
                "month": 4,
                "日本株": 1050000,
                "米国株": 1280000,
                "投資信託": 880000,
                "現金": 530000,
            },
            {
                "month": 5,
                "日本株": 1100000,
                "米国株": 1350000,
                "投資信託": 900000,
                "現金": 540000,
            },
            {
                "month": 6,
                "日本株": 1080000,
                "米国株": 1400000,
                "投資信託": 920000,
                "現金": 550000,
            },
            {
                "month": 7,
                "日本株": 1150000,
                "米国株": 1450000,
                "投資信託": 950000,
                "現金": 560000,
            },
            {
                "month": 8,
                "日本株": 1120000,
                "米国株": 1380000,
                "投資信託": 970000,
                "現金": 570000,
            },
            {
                "month": 9,
                "日本株": 1180000,
                "米国株": 1420000,
                "投資信託": 990000,
                "現金": 580000,
            },
            {
                "month": 10,
                "日本株": 1220000,
                "米国株": 1500000,
                "投資信託": 1010000,
                "現金": 590000,
            },
            {
                "month": 11,
                "日本株": 1280000,
                "米国株": 1550000,
                "投資信託": 1030000,
                "現金": 600000,
            },
            {
                "month": 12,
                "日本株": 1350000,
                "米国株": 1600000,
                "投資信託": 1050000,
                "現金": 610000,
            },
        ]

        year = 2024
        snapshots = []

        for data in monthly_data:
            # Use last day of each month
            if data["month"] == 12:
                snapshot_date = date(year, 12, 31)
            else:
                snapshot_date = date(year, data["month"] + 1, 1) - timedelta(days=1)

            total = data["日本株"] + data["米国株"] + data["投資信託"] + data["現金"]

            snapshot = AssetSnapshot(
                snapshot_date=snapshot_date,
                total_assets=Decimal(str(total)),
                japanese_stocks=Decimal(str(data["日本株"])),
                us_stocks=Decimal(str(data["米国株"])),
                investment_trusts=Decimal(str(data["投資信託"])),
                cash=Decimal(str(data["現金"])),
                holding_count=12,  # From appConfig.dashboard.stats.holdings
                yield_rate=Decimal("3.24"),  # From appConfig.dashboard.stats.yield
            )
            snapshots.append(snapshot)

        # Also add some historical yearly data (2020-2023)
        yearly_data = [
            {
                "year": 2020,
                "日本株": 650000,
                "米国株": 800000,
                "投資信託": 500000,
                "現金": 400000,
            },
            {
                "year": 2021,
                "日本株": 780000,
                "米国株": 950000,
                "投資信託": 620000,
                "現金": 450000,
            },
            {
                "year": 2022,
                "日本株": 850000,
                "米国株": 1100000,
                "投資信託": 720000,
                "現金": 480000,
            },
            {
                "year": 2023,
                "日本株": 1100000,
                "米国株": 1350000,
                "投資信託": 880000,
                "現金": 550000,
            },
        ]

        for data in yearly_data:
            snapshot_date = date(data["year"], 12, 31)
            total = data["日本株"] + data["米国株"] + data["投資信託"] + data["現金"]

            snapshot = AssetSnapshot(
                snapshot_date=snapshot_date,
                total_assets=Decimal(str(total)),
                japanese_stocks=Decimal(str(data["日本株"])),
                us_stocks=Decimal(str(data["米国株"])),
                investment_trusts=Decimal(str(data["投資信託"])),
                cash=Decimal(str(data["現金"])),
                holding_count=10,
                yield_rate=Decimal("2.80"),
            )
            snapshots.append(snapshot)

        # Add some daily data for December 2024
        daily_data = [
            {
                "day": 1,
                "日本株": 1300000,
                "米国株": 1550000,
                "投資信託": 1020000,
                "現金": 600000,
            },
            {
                "day": 5,
                "日本株": 1310000,
                "米国株": 1560000,
                "投資信託": 1025000,
                "現金": 602000,
            },
            {
                "day": 10,
                "日本株": 1320000,
                "米国株": 1555000,
                "投資信託": 1030000,
                "現金": 604000,
            },
            {
                "day": 15,
                "日本株": 1335000,
                "米国株": 1580000,
                "投資信託": 1040000,
                "現金": 606000,
            },
            {
                "day": 20,
                "日本株": 1340000,
                "米国株": 1590000,
                "投資信託": 1045000,
                "現金": 608000,
            },
            {
                "day": 25,
                "日本株": 1350000,
                "米国株": 1600000,
                "投資信託": 1050000,
                "現金": 610000,
            },
        ]

        for data in daily_data:
            # Skip if date already exists (e.g., Dec 31)
            snapshot_date = date(2024, 12, data["day"])
            existing = [s for s in snapshots if s.snapshot_date == snapshot_date]
            if existing:
                continue

            total = data["日本株"] + data["米国株"] + data["投資信託"] + data["現金"]

            snapshot = AssetSnapshot(
                snapshot_date=snapshot_date,
                total_assets=Decimal(str(total)),
                japanese_stocks=Decimal(str(data["日本株"])),
                us_stocks=Decimal(str(data["米国株"])),
                investment_trusts=Decimal(str(data["投資信託"])),
                cash=Decimal(str(data["現金"])),
                holding_count=12,
                yield_rate=Decimal("3.24"),
            )
            snapshots.append(snapshot)

        session.add_all(snapshots)
        await session.commit()
        print(f"✓ Seeded {len(snapshots)} asset snapshots")


async def main():
    """Run all seed functions."""
    print("Starting database seed...")
    await seed_savings_goals()
    await seed_asset_snapshots()
    print("✓ Database seeding complete!")


if __name__ == "__main__":
    asyncio.run(main())
