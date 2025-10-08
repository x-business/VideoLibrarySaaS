import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    console.log('Starting database initialization...')
    
    // Test if tables exist by trying to count users
    try {
      await prisma.user.count()
      console.log('Database tables already exist')
      return NextResponse.json({ 
        message: 'Database tables already exist',
        success: true 
      })
    } catch (error) {
      console.log('Tables do not exist, creating them...')
    }

    // Create tables by running a simple query that will trigger table creation
    // This is a workaround since we can't run migrations directly
    await prisma.$executeRaw`CREATE TABLE IF NOT EXISTS "users" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "email" TEXT NOT NULL UNIQUE,
      "password" TEXT NOT NULL,
      "role" TEXT NOT NULL DEFAULT 'USER',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL,
      "subscriptionStatus" TEXT DEFAULT 'inactive',
      "stripeCustomerId" TEXT,
      "stripeSubscriptionId" TEXT
    )`

    await prisma.$executeRaw`CREATE TABLE IF NOT EXISTS "accounts" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "provider" TEXT NOT NULL,
      "providerAccountId" TEXT NOT NULL,
      "refresh_token" TEXT,
      "access_token" TEXT,
      "expires_at" INTEGER,
      "token_type" TEXT,
      "scope" TEXT,
      "id_token" TEXT,
      "session_state" TEXT,
      UNIQUE("provider", "providerAccountId")
    )`

    await prisma.$executeRaw`CREATE TABLE IF NOT EXISTS "sessions" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "sessionToken" TEXT NOT NULL UNIQUE,
      "userId" TEXT NOT NULL,
      "expires" TIMESTAMP(3) NOT NULL
    )`

    await prisma.$executeRaw`CREATE TABLE IF NOT EXISTS "verification_tokens" (
      "identifier" TEXT NOT NULL,
      "token" TEXT NOT NULL UNIQUE,
      "expires" TIMESTAMP(3) NOT NULL,
      UNIQUE("identifier", "token")
    )`

    await prisma.$executeRaw`CREATE TABLE IF NOT EXISTS "videos" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "youtubeUrl" TEXT NOT NULL,
      "title" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL
    )`

    // Create indexes
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "accounts_userId_idx" ON "accounts"("userId")`
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "sessions_userId_idx" ON "sessions"("userId")`
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "videos_userId_idx" ON "videos"("userId")`

    console.log('Database tables created successfully')
    
    return NextResponse.json({ 
      message: 'Database initialized successfully',
      success: true,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Database initialization error:', error)
    
    return NextResponse.json(
      { 
        message: 'Database initialization failed',
        error: (error as Error).message,
        success: false
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Test database connection and show table info
    const userCount = await prisma.user.count()
    const accountCount = await prisma.account.count()
    const sessionCount = await prisma.session.count()
    const videoCount = await prisma.video.count()
    
    return NextResponse.json({ 
      message: 'Database connection successful',
      tables: {
        users: userCount,
        accounts: accountCount,
        sessions: sessionCount,
        videos: videoCount
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Database test error:', error)
    
    return NextResponse.json(
      { 
        message: 'Database connection failed',
        error: (error as Error).message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
