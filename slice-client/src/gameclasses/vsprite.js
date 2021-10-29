class VSprite {
    constructor(spriteJson) {
        this.animations = new Map();
        for (let animationIndex in spriteJson.animations){
            let newAnimation = new Animation()
            for (let spriteIndex in spriteJson.animations[animationIndex].sprites){
                let newSprite = new Sprite()
                for(let shapeIndex in spriteJson.animations[animationIndex].sprites[spriteIndex].shapes) {
                    let newShape = new Shape()
                    for(let vertIndex in spriteJson.animations[animationIndex].sprites[spriteIndex].shapes[shapeIndex].verticies) {
                        let vertexData = spriteJson.animations[animationIndex].sprites[spriteIndex].shapes[shapeIndex].verticies[vertIndex]
                        let newVertex = new Vertex(vertexData.x, vertexData.y)
                        newShape.verticies.push(newVertex)
                    }
                    newSprite.shapes.push(newShape)
                }
                newAnimation.sprites.push(newSprite)
            }
            this.animations.set(spriteJson.animations[animationIndex].name, newAnimation)
        }
        this.incrementer = 0
        this.frame = 0
        this.last_time = performance.now()
    }

    draw = (ctx, x, y, scale, flipped = false, animationName) => {
        if (this.animations.length == 0)
            return
        
        const animation = this.animations.get(animationName)
        if (animation == undefined)
            return

        const cur_time = performance.now()
        const delta_time = cur_time - this.last_time
        this.last_time = cur_time
        
        this.incrementer += delta_time / 1000.0
        if (this.incrementer > 1.0/24) {
            this.frame += 1
            this.incrementer = 0
        }

        const sprite_index = this.frame % animation.sprites.length

        ctx.fillStyle = 'black';
        const flipMultiplier = flipped ? -1 : 1

        animation.sprites[sprite_index].shapes.forEach(shape => {
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

class Animation {
    constructor() {
        this.sprites = []
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