import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  reviewCount?: number;
}

export default function StarRating({ rating, reviewCount }: StarRatingProps) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5">
        {/* Full stars */}
        {[...Array(fullStars)].map((_, i) => (
          <Star
            key={`full-${i}`}
            className="w-4 h-4 fill-yellow-400 text-yellow-400"
          />
        ))}

        {/* Half star */}
        {hasHalfStar && (
          <div className="relative">
            <Star className="w-4 h-4 text-yellow-400" />
            <div className="absolute top-0 left-0 overflow-hidden" style={{ width: '50%' }}>
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            </div>
          </div>
        )}

        {/* Empty stars */}
        {[...Array(emptyStars)].map((_, i) => (
          <Star
            key={`empty-${i}`}
            className="w-4 h-4 text-gray-300"
          />
        ))}
      </div>

      <div className="flex items-center gap-1 text-sm text-gray-600">
        <span className="font-semibold">{rating.toFixed(1)}</span>
        {reviewCount && (
          <span className="text-gray-400">({reviewCount})</span>
        )}
      </div>
    </div>
  );
}
