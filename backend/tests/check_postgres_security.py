from sqlalchemy import text

from db.database import engine


with engine.connect() as connection:
    transaction = connection.begin()
    try:
        connection.execute(text("CREATE ROLE demo_public_reader NOLOGIN"))
        connection.execute(text("GRANT USAGE ON SCHEMA public TO demo_public_reader"))
        connection.execute(text("GRANT SELECT ON ALL TABLES IN SCHEMA public TO demo_public_reader"))
        connection.execute(text("SET LOCAL ROLE demo_public_reader"))
        for table in ["users", "donations", "uploaded_files"]:
            assert connection.execute(text(f"SELECT COUNT(*) FROM {table}")).scalar_one() == 0
    finally:
        transaction.rollback()

print("Public database role cannot read accounts, donations or uploaded files.")
