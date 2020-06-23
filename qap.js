class Qap {
	constructor() {
		this.points = new Set();
		this.exclude = {}
	}

	add(point) {
		if (point >= Math.pow(2, this.dim))
			throw new RangeError(`Point too large for dimension ${this.dim}`);
		if (this.exclude[point])
			throw new RangeError("Point excluded");
		// If we already have the point, just silently return
		// If we try to create excludes with a point we already have, we'll mess up our cap
		if (this.points.has(point))
			return;
		// Update the exclude
		for (let p1 of this.points) {
			for (let p2 of this.points) {
				if (p1 < p2) {
					let exc = point^p1^p2;
					if (!this.exclude[exc])
						this.exclude[exc] = 0;
					this.exclude[exc]++;
				}
			}
		}
		// Add the point
		this.points.add(point)
	}
	update_excludes() {
		this.exclude = {}
		for (let p1 of this.points) {
			for (let p2 of this.points) {
				for (let p3 of this.points) {
					let exc = p1^p2^p3;
					if (!this.exclude[exc])
						this.exclude[exc] = 0;
					if (p1 < p2 < p3)
						this.exclude[exc]++;
				}
			}
		}
	}
	remove(point) {
		if (!this.points.has(point))
			return;
		this.points.delete(point);
		// Trim the excludes.
		for (let p1 of this.points) {
			for (let p2 of this.points) {
				if (p1 < p2)
					this.exclude[point^p1^p2]--;
			}
		}
	}
	contains(point) {
		return this.points.has(point);
	}
	excludes(point) {
		if (!this.exclude[point])
			this.exclude[point] = 0;
		return this.exclude[point];
	}
	clear() {
		this.points = new Set();
		this.exclude = {};
	}
	size () {
        return this.points.size;
    }
	changeDim(newDim) {
		for (let p of this.points) {
			if (p > Math.pow(2, newDim))
				this.remove(p);
		}
	}
}
