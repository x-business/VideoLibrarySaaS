import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function validateYouTubeUrl(url: string): boolean {
  const patterns = [
    /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/,
    /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+/,
    /^https?:\/\/(www\.)?youtu\.be\/[\w-]+/,
  ];

  return patterns.some((pattern) => pattern.test(url));
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has active subscription
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { subscriptionStatus: true }
    });

    if (!user || user.subscriptionStatus !== 'active') {
      return NextResponse.json({ error: 'Active subscription required' }, { status: 403 });
    }

    const videos = await prisma.video.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ videos });
  } catch (error) {
    console.error('Failed to fetch videos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch videos' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has active subscription
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { subscriptionStatus: true }
    });

    if (!user || user.subscriptionStatus !== 'active') {
      return NextResponse.json({ error: 'Active subscription required' }, { status: 403 });
    }

    const { youtube_url, title } = await req.json();

    if (!youtube_url) {
      return NextResponse.json({ error: 'YouTube URL is required' }, { status: 400 });
    }

    if (!validateYouTubeUrl(youtube_url)) {
      return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });
    }

    // Check for duplicate URL
    const existingVideo = await prisma.video.findFirst({
      where: { 
        youtubeUrl: youtube_url,
        userId: session.user.id
      }
    });

    if (existingVideo) {
      return NextResponse.json({ error: 'Video already exists' }, { status: 400 });
    }

    const video = await prisma.video.create({
      data: {
        youtubeUrl: youtube_url,
        title: title || null,
        userId: session.user.id,
      }
    });

    return NextResponse.json({ video });
  } catch (error) {
    console.error('Failed to add video:', error);
    return NextResponse.json(
      { error: 'Failed to add video' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const videoId = searchParams.get('id');

    if (!videoId) {
      return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
    }

    // Check if video belongs to user
    const video = await prisma.video.findFirst({
      where: { 
        id: videoId,
        userId: session.user.id
      }
    });

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    await prisma.video.delete({
      where: { id: videoId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete video:', error);
    return NextResponse.json(
      { error: 'Failed to delete video' },
      { status: 500 }
    );
  }
}