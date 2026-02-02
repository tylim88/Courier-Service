import { tuple, coerce, enum as enum_, type ZodError } from 'zod'

const schema = coerce.number().int().min(1)
export const validations = {
	1: (value: string, callback: (numberOfPackages: number) => void) => {
		const inputs = value.split(' ')
		const error = tuple([schema, schema]).safeParse(inputs).error

		if (error) {
			return error.issues.reduce((acc, { code, message, path }) => {
				return `${acc}\r
\r
code: ${code}\r
argument: ${['cost of delivery', 'number of packages'][Number(path[0])]}\r
path: ${Number(path[0]) + 1}\r
message: ${message.split(',')[0]}, received "${value}"\r`
			}, '')
		} else {
			callback(Number(inputs[1]))
			return ''
		}
	},
	2: (value: string, callback: (v: number) => void) => {
		const inputs = value.split(' ')
		const error = tuple([
			schema,
			schema,
			enum_(Object.keys(codes) as [keyof typeof codes]).optional(),
		])
			.superRefine(([weight, distance, code], ctx) => {
				if (!code) return
				const data = { weight, distance }
				;(Object.keys(data) as [keyof typeof data]).forEach(key => {
					const max = codes[code][`${key}_max`]

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

					const min = codes[code][`${key}_min`]
					if (data[key] < min) {
						ctx.addIssue({
							code: 'too_small',
							minimum: max,
							input: data[key],
							inclusive: true,
							origin: 'number',
							message: `expect the ${key} to be more than ${max}${units[key]}, but received ${data[key]}${units[key]}`,
						})
					}
				})
			})
			.safeParse(inputs).error
		if (error) {
		} else {
			return ''
		}
	},
	// value and callback of step 3 are dummy parameters
	3: (value: string, callback: (v: number) => void) => '',
}

const units = {
	distance: 'km',
	weight: 'kg',
}

const codes = {
	OFR001: {
		distance_min: 0,
		distance_max: 200,
		weight_min: 70,
		weight_max: 200,
	},
	OFR002: {
		distance_min: 50,
		distance_max: 150,
		weight_min: 100,
		weight_max: 250,
	},
	OFR003: {
		distance_min: 50,
		distance_max: 250,
		weight_min: 10,
		weight_max: 150,
	},
}

const constrcutErrorString = (
	error: ZodError<[number, number]>,
	value: string,
) => {
	return error.issues.reduce((acc, { code, message, path }) => {
		return `${acc}\r
\r
code: ${code}\r
argument: ${['cost of delivery', 'number of packages'][Number(path[0])]}\r
path: ${Number(path[0]) + 1}\r
message: ${message.split(',')[0]}, received "${value}"\r`
	}, '')
}
