#!/usr/bin/env python3
"""
Script to initialize database tables
"""
import asyncio
from database import connect_db, disconnect_db, database

async def init_database():
    await connect_db()
    
    try:
        # Create users table
        users_table = """
        CREATE TABLE IF NOT EXISTS users (
            user_id SERIAL PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            first_name VARCHAR(50),
            last_name VARCHAR(50),
            tel VARCHAR(20),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """
        
        # Create pdf_files table
        pdf_files_table = """
        CREATE TABLE IF NOT EXISTS pdf_files (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
            name VARCHAR(255) NOT NULL,
            file_path VARCHAR(500) NOT NULL,
            uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """
        
        await database.execute(users_table)
        await database.execute(pdf_files_table)
        
        print("✅ Database tables created successfully!")
        
    except Exception as e:
        print(f"❌ Error creating tables: {e}")
    
    finally:
        await disconnect_db()

if __name__ == "__main__":
    asyncio.run(init_database())
