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
		if(this.getTop() > otherRectangle.getBottom())
			return false;
		if(this.getBottom() < otherRectangle.getTop())
			return false;
		if(this.getLeft() > otherRectangle.getRight())
			return false;
		if(this.getRight() < otherRectangle.getLeft())
			return false;

		return true;
	}
}

export default Collider;