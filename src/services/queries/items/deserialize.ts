import type { Item } from '$services/types';
import { DateTime } from 'luxon';

export const deserialize = (id: string, item: { [key: string]: string }): Item => {
  return {
    id,
    name: item.name,
    ownerId: item.ownerId,
    imageUrl: item.imageUrl,
    description: item.description,
    createdAt: DateTime.fromMillis(+item.createdAt),
    endingAt: DateTime.fromMillis(+item.endingAt),
    views: +item.views,
    likes: +item.likes,
    price: +item.price,
    bids: +item.bids,
    highestBidUserId: item.highestBidUserId,
  }
};
