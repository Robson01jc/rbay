import { randomBytes } from 'crypto';
import { client } from './client';

export const withLock = async (key: string, cb: () => any) => {
	const retryDelayMs = 100
	let retries = 20
	const token = randomBytes(6).toString('hex')
	const lockKey = `lock:${key}`

	while (retries >= 0) {
		retries--

		const acquired = await client.set(lockKey, token, {
			NX: true
		})

		if (!acquired) {
			await pause(retryDelayMs)
			continue
		}

		const result = await cb()
		await client.del(lockKey)

		return result
	}
};

const buildClientProxy = () => { };

const pause = (duration: number) => {
	return new Promise((resolve) => {
		setTimeout(resolve, duration);
	});
};
