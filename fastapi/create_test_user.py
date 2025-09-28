#!/usr/bin/env python3
"""
Script to create a test user for authentication testing
"""
import asyncio
from auth import hash_password
from database import connect_db, disconnect_db, insert_user

async def create_test_user():
    await connect_db()
    
    # Test user credentials
    username = "testuser"
    email = "test@example.com"
    password = "testpassword123"
    first_name = "Test"
    last_name = "User"
    
    # Hash the password
    password_hash = hash_password(password)
    
    try:
        # Insert the test user
        result = await insert_user(
            username=username,
            password_hash=password_hash,
            email=email,
            first_name=first_name,
            last_name=last_name,
            tel=None
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
        print(f"❌ Error creating test user: {e}")
    
    finally:
        await disconnect_db()

if __name__ == "__main__":
    asyncio.run(create_test_user())
