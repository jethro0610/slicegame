class Collider {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    getTop = () => {
		return this.y;
	}

	getBottom = () => {
		return this.y + this.height;
	}

	getLeft = () => {
		return this.x;
	}
	
	getRight = () => {
		return this.x + this.width;
	}

	isIntersecting = (otherRectangle) => {
		if(this.top() > otherRectangle.bottom())
			return false;
		if(this.bottom() < otherRectangle.top())
			return false;
		if(this.left() > otherRectangle.right())
			return false;
		if(this.right() < otherRectangle.left())
			return false;

		return true;
	}
}

export default Collider;