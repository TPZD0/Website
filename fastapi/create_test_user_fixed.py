#!/usr/bin/env python3
"""
Script to create a test user with proper password hashing
"""
import asyncio
from auth import hash_password
from database import connect_db, disconnect_db, database

async def create_test_user():
    await connect_db()
    
    try:
        # Delete existing test users first
        await database.execute("DELETE FROM users WHERE username IN ('testuser', 'student1')")
        
        # Create test user with proper password hash
        username = "testuser"
        email = "test@example.com"
        password = "testpassword123"
        password_hash = hash_password(password)
        
        query = """
        INSERT INTO users (username, password_hash, email, first_name, last_name)
        VALUES (:username, :password_hash, :email, :first_name, :last_name)
        RETURNING user_id, username, email
        """
        
        result = await database.fetch_one(
            query=query,
            values={
                "username": username,
                "password_hash": password_hash,
                "email": email,
                "first_name": "Test",
                "last_name": "User"
            }
        )
        
        if result:
            print(f"✅ Test user created successfully!")
            print(f"   Username: {username}")
            print(f"   Email: {email}")
            print(f"   Password: {password}")
            print(f"   User ID: {result['user_id']}")
        else:
            print("❌ Failed to create test user")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    
    finally:
        await disconnect_db()

if __name__ == "__main__":
    asyncio.run(create_test_user())
