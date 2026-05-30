import type { GradientCoordinates } from './types';

export function useGradientCoordinates(
	reverse: boolean,
	startX: number,
	startY: number,
	endX: number,
	endY: number,
	beamLength: number
): GradientCoordinates {
	const dx = endX - startX;
	const dy = endY - startY;
	const isHorizontal = Math.abs(dx) >= Math.abs(dy);
	const length = Math.min(Math.max(beamLength, 0.001), 1) * 100;

	if (isHorizontal) {
		return reverse
			? {
					x1: [`${100 - length}%`, `${-length}%`],
					x2: ['100%', '0%'],
					y1: ['0%', '0%'],
					y2: ['0%', '0%']
				}
			: {
					x1: [`${length}%`, `${100 + length}%`],
					x2: ['0%', '100%'],
					y1: ['0%', '0%'],
					y2: ['0%', '0%']
				};
	}

	return reverse
		? {
				y1: [`${100 - length}%`, `${-length}%`],
				y2: ['100%', '0%'],
				x1: ['0%', '0%'],
				x2: ['0%', '0%']
			}
		: {
				y1: [`${length}%`, `${100 + length}%`],
				y2: ['0%', '100%'],
				x1: ['0%', '0%'],
				x2: ['0%', '0%']
			};
}
