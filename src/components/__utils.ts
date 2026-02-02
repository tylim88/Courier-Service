import { type ZodError, coerce } from 'zod'

export const constructErrorString = (
	error: ZodError<any>,
	arguments_: string[],
) => {
	return error.issues.reduce((acc, { code, message, path }) => {
		return `${acc}\r
\r
code: ${code}\r${
			path.length ? `argument: ${arguments_[Number(path[0])]}\r` : ''
		}
message: ${message}\r`
	}, '')
}

export const positiveIntegerSchema = coerce.number().int().min(1)
