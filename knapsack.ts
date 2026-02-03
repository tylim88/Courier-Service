export const knapsack = (inputs: { value: number }[], capacity: number) => {
	const values = inputs.map(({ value }) => value)

	const array_2D = Array(values.length + 1)
		.fill(0)
		.map(() => Array(capacity).fill(0))

	// for (let i = 1; i <= values.length; i++) {
	// 	const w = weights[i - 1]
	// 	const v = values[i - 1]
	//     for(let j = 1;j<=)
	// }
}
