"""Database initialization and seeding entrypoint."""
from rail_opti.database.session import Base, engine, SessionLocal
from rail_opti.database.models import *  # ensure all models are registered with Base
from rail_opti.database.seed_data import seed_database


def init_db():
    """Create tables and populate seed data if not present."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()


if __name__ == "__main__":
    print("Initializing RAILOPT AI database and seeding records...")
    init_db()
    print("Database initialization complete.")
