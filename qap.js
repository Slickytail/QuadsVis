class Qap {
	constructor(DIM) {
		this.points = new Set();
		this.exclude = {}
		this.dim = DIM;
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
	isComplete() {
        // This should be cached
        for (let i = 0; i < Math.pow(2, this.dim); i++) {
            if (!this.points.has(i) && !this.exclude[i])
                return false
        }
        return true;
    }
	complete() {
        for (let i = 0; i < Math.pow(2, this.dim); i++) {
            if (!this.points.has(i) && !this.exclude[i])
                this.add(i);
        }
    }
    random(next, done) {
        // I am defining "a random qap" in the naive way:
        //   a qap constructed by randomly following the contruction tree, from the current qap.
        // This function adds a random point, then calls the callback.
        // Normally, clear() is called before this.
        const nP = Math.pow(2, this.dim) - 
            (
                this.points.size + 
                Object.values(this.exclude).filter(x => x).length
            )
        if (nP == 0) {
            setTimeout(done);
            return;
        }
        const indexToAdd = Math.floor(Math.random() * nP);
        let found = 0;
        for (let i = 0; i < Math.pow(2, this.dim); i++) {
            if (!this.points.has(i) && !this.exclude[i]) {
                if (found == indexToAdd) {
                    this.add(i);
                    setTimeout(next);
                    return;
                }
                found++;
            }
        }
        throw "ops"
    }
	size () {
        return this.points.size;
    }
	changeDim(newDim) {
		for (let p of this.points) {
			if (p > Math.pow(2, newDim))
				this.remove(p);
		}
		this.dim = newDim;
	}
}
