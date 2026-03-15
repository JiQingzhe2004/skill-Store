import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3001'



export const dynamic = 'force-dynamic'

async function proxyRequest(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const params = await context.params
  const upstreamUrl = new URL(`/api/${params.path.join('/')}`, API_BASE_URL)
  upstreamUrl.search = request.nextUrl.search

  const headers = new Headers(request.headers)
  headers.delete('host')
  headers.delete('content-length')

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: 'manual',
  }

  if (!['GET', 'HEAD'].includes(request.method)) {
    init.body = await request.text()
  }

  const upstreamResponse = await fetch(upstreamUrl, init)
  const response = new NextResponse(upstreamResponse.body, {
    status: upstreamResponse.status,
  })

  upstreamResponse.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'set-cookie') {
      return
    }

    response.headers.set(key, value)
  })

  const setCookieHeader = (upstreamResponse.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie?.()

  if (setCookieHeader?.length) {
    for (const cookie of setCookieHeader) {
      response.headers.append('set-cookie', cookie)
    }
  } else {
    const singleSetCookie = upstreamResponse.headers.get('set-cookie')
    if (singleSetCookie) {
      response.headers.set('set-cookie', singleSetCookie)
    }
  }

  return response
}

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, context)
}

export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, context)
}

export async function PUT(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, context)
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, context)
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, context)
}
