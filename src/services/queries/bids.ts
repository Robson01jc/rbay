import { bidHistoryKey, itemsByPriceKey, itemsKey } from '$services/keys';
import { client, withLock } from '$services/redis';
import type { Bid, CreateBidAttrs } from '$services/types';
import { DateTime } from 'luxon';
import { getItem } from './items';

export const createBid = async (attrs: CreateBidAttrs) => {
	return withLock(itemsKey(attrs.itemId), async (lockedClient: typeof client) => {
		const item = await getItem(attrs.itemId)

		if (!item) {
			throw new Error('Item does not exist')
		}
		if (item.price >= attrs.amount) {
			throw new Error('Bid too low')
		}
		if (item.endingAt.diff(DateTime.now()).toMillis() < 0) {
			throw new Error('Item closed to bidding')
		}

		const serialized = serializeHistory(
			attrs.amount,
			attrs.createdAt.toMillis()
		)

		return Promise.all([
			lockedClient.rPush(bidHistoryKey(attrs.itemId), serialized),
			lockedClient.hSet(itemsKey(item.id), {
				bids: item.bids + 1,
				price: attrs.amount,
				highestBidUserId: attrs.userId,
			}),
			lockedClient.zAdd(itemsByPriceKey(), {
				value: item.id,
				score: attrs.amount,
			}),
		])
	})

	// return client.executeIsolated(async (isolatedClient) => {
	// 	await isolatedClient.watch(itemsKey(attrs.itemId))

	// 	const item = await getItem(attrs.itemId)

	// 	if (!item) {
	// 		throw new Error('Item does not exist')
	// 	}
	// 	if (item.price >= attrs.amount) {
	// 		throw new Error('Bid too low')
	// 	}
	// 	if (item.endingAt.diff(DateTime.now()).toMillis() < 0) {
	// 		throw new Error('Item closed to bidding')
	// 	}

	// 	const serialized = serializeHistory(
	// 		attrs.amount,
	// 		attrs.createdAt.toMillis()
	// 	)

	// 	return isolatedClient
	// 		.multi()
	// 		.rPush(bidHistoryKey(attrs.itemId), serialized)
	// 		.hSet(itemsKey(item.id), {
	// 			bids: item.bids + 1,
	// 			price: attrs.amount,
	// 			highestBidUserId: attrs.userId,
	// 		})
	// 		.zAdd(itemsByPriceKey(), {
	// 			value: item.id,
	// 			score: attrs.amount,
	// 		})
	// 		.exec()
	// })
};

export const getBidHistory = async (itemId: string, offset = 0, count = 10): Promise<Bid[]> => {
	const startIndex = -1 * offset - count
	const endIndex = -1 - offset

	const range = await client.lRange(
		bidHistoryKey(itemId),
		startIndex,
		endIndex
	)

	return range.map(deserializeHistory);
};

const serializeHistory = (amount: number, createdAt: number) => {
	return `${amount}:${createdAt}`
}

const deserializeHistory = (stored: string) => {
	const [amount, createdAt] = stored.split(':')

	return {
		amount: +amount,
		createdAt: DateTime.fromMillis(+createdAt),
	}
}