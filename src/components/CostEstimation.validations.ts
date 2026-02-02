import { tuple, enum as enum_ } from 'zod'
import { constructErrorString, positiveIntegerSchema } from './__utils'

export const validateStep1 = (
	value: string,
	callback: (costOfDelivery: number, numberOfPackages: number) => void,
) => {
	const inputs = value.trim().split(' ')
	const error = tuple([positiveIntegerSchema, positiveIntegerSchema]).safeParse(
		inputs,
	).error

	if (error) {
		return constructErrorString(error, [
			'cost of delivery',
			'number of packages',
		])
	} else {
		callback(Number(inputs[0]), Number(inputs[1]))
		return ''
	}
}
export const validateStep2 = (
	value: string,
	basicCost: number,
	callback: (result: string) => void,
) => {
	const inputs = value.trim().split(' ')
	const error = tuple([
		positiveIntegerSchema,
		positiveIntegerSchema.max(17208, {
			error:
				'17208km is the longest straight line distance on earth between 2 points',
		}),
		enum_(Object.keys(offers) as [keyof typeof offers]).optional(),
	])
		.superRefine(([weight, distance, offer], ctx) => {
			const data = { weight, distance }
			;(Object.keys(data) as [keyof typeof data]).forEach(key => {
				const max = offer ? offers[offer][`${key}_max`] : Infinity

				if (data[key] > max) {
					ctx.addIssue({
						code: 'too_big',
						maximum: max,
						input: data[key],
						inclusive: true,
						origin: 'number',
						message: `expect the ${key} to be less than ${max}${units[key]}, but received ${data[key]}${units[key]}`,
					})
				}

				const min = offer ? offers[offer][`${key}_min`] : -Infinity
				if (data[key] < min) {
					ctx.addIssue({
						code: 'too_small',
						minimum: max,
						input: data[key],
						inclusive: true,
						origin: 'number',
						message: `expect the ${key} to be more than ${min}${units[key]}, but received ${data[key]}${units[key]}`,
					})
				}
			})
			const costWithoutDiscount = basicCost + weight * 10 + distance * 5
			const discount = offer ? offers[offer].discount : 0
			callback(
				`${parseFloat((costWithoutDiscount * discount).toFixed(2))} ${parseFloat((costWithoutDiscount * (1 - discount)).toFixed(2))}`,
			)
		})
		.safeParse(inputs).error
	if (error) {
		return constructErrorString(error, ['weight', 'distance', 'offer'])
	} else {
		return ''
	}
}

const units = {
	distance: 'km',
	weight: 'kg',
}

const offers = {
	OFR001: {
		discount: 0.1,
		distance_min: 0,
		distance_max: 200,
		weight_min: 70,
		weight_max: 200,
	},
	OFR002: {
		discount: 0.07,
		distance_min: 50,
		distance_max: 150,
		weight_min: 100,
		weight_max: 250,
	},
	OFR003: {
		discount: 0.05,
		distance_min: 50,
		distance_max: 250,
		weight_min: 10,
		weight_max: 150,
	},
}
