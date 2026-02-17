import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'

export function PostCardSkeleton() {
  return (
    <Card className="flex flex-col animate-pulse">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <div className="h-5 w-16 bg-muted rounded" />
          <div className="flex items-center gap-2">
            <div className="h-4 w-16 bg-muted rounded" />
            <div className="h-4 w-20 bg-muted rounded" />
          </div>
        </div>
        <div className="h-6 w-3/4 bg-muted rounded mt-2" />
      </CardHeader>
      
      <CardContent className="pb-2 flex-1">
        <div className="space-y-2">
          <div className="h-4 w-full bg-muted rounded" />
          <div className="h-4 w-2/3 bg-muted rounded" />
        </div>
      </CardContent>
      
      <CardFooter className="pt-2 flex-col items-start gap-2">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 bg-muted rounded-full" />
          <div className="h-4 w-24 bg-muted rounded" />
        </div>
        <div className="flex gap-1">
          <div className="h-5 w-14 bg-muted rounded" />
          <div className="h-5 w-16 bg-muted rounded" />
        </div>
      </CardFooter>
    </Card>
  )
}

export function PostCardSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <PostCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function PostCardSkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <PostCardSkeleton key={i} />
      ))}
    </div>
  )
}
