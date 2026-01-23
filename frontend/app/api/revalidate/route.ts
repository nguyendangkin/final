import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { path } = body;

    if (!path || typeof path !== 'string') {
      return NextResponse.json({ error: 'Path is required' }, { status: 400 });
    }

    // Revalidate the specific path
    revalidatePath(path);

    // Also revalidate related paths for cars
    if (path.startsWith('/cars')) {
      revalidatePath('/');
    }

    return NextResponse.json({ success: true, revalidated: path });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to revalidate' }, { status: 500 });
  }
}
