import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    console.log('Starting database seeding...')
    
    // Hash passwords
    const adminPassword = await bcrypt.hash('admin123', 12)
    const userPassword = await bcrypt.hash('user123', 12)

    // Create admin user
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: {
        email: 'admin@example.com',
        password: adminPassword,
        role: 'ADMIN',
      },
    })
    console.log('Admin user created:', adminUser.email)

    // Create regular user
    const regularUser = await prisma.user.upsert({
      where: { email: 'user@example.com' },
      update: {},
      create: {
        email: 'user@example.com',
        password: userPassword,
        role: 'USER',
      },
    })
    console.log('Test user created:', regularUser.email)

    return NextResponse.json({ 
      message: 'Database seeded successfully',
      users: [
        { email: adminUser.email, role: adminUser.role },
        { email: regularUser.email, role: regularUser.role }
      ],
      success: true
    })
    
  } catch (error) {
    console.error('Database seeding error:', error)
    
    return NextResponse.json(
      { 
        message: 'Database seeding failed',
        error: (error as Error).message,
        success: false
      },
      { status: 500 }
    )
  }
}
