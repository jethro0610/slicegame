class VSprite {
    constructor(spriteJson) {
        this.sprites = [];
        this.animations = new Map();
        for (let spriteIndex in spriteJson.sprites){
            let newSprite = new Sprite()
            for(let shapeIndex in spriteJson.sprites[spriteIndex].shapes) {
                let newShape = new Shape()
                for(let vertIndex in spriteJson.sprites[spriteIndex].shapes[shapeIndex].verticies) {
                    let vertexData = spriteJson.sprites[spriteIndex].shapes[shapeIndex].verticies[vertIndex]
                    let newVertex = new Vertex(vertexData.x, vertexData.y)
                    newShape.verticies.push(newVertex)
                }
                newSprite.shapes.push(newShape)
            }
            this.sprites.push(newSprite)
        }
    }

    add_animation(startIndex, endIndex, name) {
        this.animations.set(name, new VSpriteAnimation(startIndex, endIndex))
    }

    draw = (ctx, x, y, scale, flipped = false, animationName = '') => {
        if (this.sprites.length <= 0)
            return;

        ctx.fillStyle = 'black';
        
        const flipMultiplier = flipped ? -1 : 1

        let spriteIndex;
        if (this.animations.length == 0 || animationName == '')
            spriteIndex = 0;
        else {
            let animation = this.animations.get(animationName)
            spriteIndex = (parseInt(Date.now()/45) % animation.length) + animation.startIndex
        }
        this.sprites[spriteIndex].shapes.forEach(shape => {
            ctx.beginPath();
            ctx.moveTo(x + shape.verticies[0].x * scale * flipMultiplier, y - shape.verticies[0].y * scale)
            for (let i = 1; i < shape.verticies.length; i++) {
                ctx.lineTo(x + shape.verticies[i].x * scale * flipMultiplier, y - shape.verticies[i].y * scale);
            }
            ctx.closePath();
            ctx.fill(); 
        })
    }
}

class VSpriteAnimation {
    constructor(startIndex, endIndex) {
        this.startIndex = startIndex
        this.length = startIndex - endIndex
    }
}

class Sprite {
    constructor() {
        this.shapes = [];
    }
}

class Shape {
    constructor() {
        this.verticies = [];
    }   
}

class Vertex {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

export default VSprite;