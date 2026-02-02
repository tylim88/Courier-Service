import { tuple, coerce } from 'zod'

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
		const error = tuple([schema, schema])
	},
	3: (value: string, callback: (v: number) => void) => '',
}
