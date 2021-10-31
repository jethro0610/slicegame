const randomRange = (min, max) => {
    const range = max - min;
    return Math.random() * range + min
}

class DashEffectState {
    constructor(startX, startY, direction) {
        this.direction = direction
        this.duration = 25;
        this.curTime = 0;
        this.x = []
        this.y = []
        this.velX = [] 
        this.velY = []
        for (let i = 0; i < 5; i++) {
            this.x.push(startX + randomRange(-10, 10))
            this.y.push(startY + randomRange(-10, 10))
            this.velX.push(randomRange(1, 5) * direction)
            this.velY.push(randomRange(-1, -4))
        }
    }

    tick = () => {
        for (let i = 0; i < 5; i++) {
            this.velX[i] -= this.direction * 0.01;
            this.velY[i] += 0.1
            this.x[i] += this.velX[i];
            this.y[i] += this.velY[i];
        }
        this.curTime += 1;
    }
    
    draw = (ctx) => {
        const opacity = 1.0 - (this.curTime / this.duration);
        ctx.fillStyle = 'rgba(255, 255, 255, ' + opacity.toString() + ')';
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.arc(this.x[i], this.y[i], 5 + (this.curTime / this.duration) * 10, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    shouldDestroy = () => {
        return this.curTime > this.duration;
    }
}

class LandEffectState {
    constructor(startX, startY, startVelX) {
        this.duration = 25;
        this.curTime = 0;
        this.x = []
        this.y = []
        this.velX = [] 
        this.velY = []
        for (let i = 0; i < 5; i++) {
            this.x.push(startX + randomRange(-20, 20))
            this.y.push(startY + randomRange(-10, 10))
            this.velX.push(randomRange(1, 5) + startVelX)
            this.velY.push(randomRange(-1, -2))
        }

        for (let i = 0; i < 5; i++) {
            this.x.push(startX + randomRange(-10, 10))
            this.y.push(startY + randomRange(-10, 10))
            this.velX.push(randomRange(-1, -5) + startVelX)
            this.velY.push(randomRange(-0.5, -1.5))
        }
    }

    tick = () => {
        for (let i = 0; i < 10; i++) {
            this.velX[i] *= 0.95
            this.velY[i] += 0.05
            this.x[i] += this.velX[i];
            this.y[i] += this.velY[i];
        }
        this.curTime += 1;
    }
    
    draw = (ctx) => {
        const opacity = 1.0 - (this.curTime / this.duration);
        ctx.fillStyle = 'rgba(255, 255, 255, ' + opacity.toString() + ')';
        for (let i = 0; i < 10; i++) {
            ctx.beginPath();
            ctx.arc(this.x[i], this.y[i], 5 + (this.curTime / this.duration) * 6, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    shouldDestroy = () => {
        return this.curTime > this.duration;
    }
}

class AttackEffectState {
    constructor(startX, startY, direction) {
        this.direction = direction
        this.duration = 15;
        this.curTime = 0;
        this.x = []
        this.y = []
        this.velX = [] 
        this.velY = []
        for (let i = 0; i < 5; i++) {
            this.x.push(startX + randomRange(-5, 5))
            this.y.push(startY + randomRange(-5, 5))
            this.velX.push(randomRange(5, 10) * direction)
            this.velY.push(randomRange(2, -2))
        }
    }

    tick = () => {
        for (let i = 0; i < 5; i++) {
            this.x[i] += this.velX[i];
            this.y[i] += this.velY[i];
        }
        this.curTime += 1;
    }
    
    draw = (ctx) => {
        const opacity = 0.75 - (this.curTime / this.duration) * 0.75;
        ctx.fillStyle = 'rgba(255, 255, 255, ' + opacity.toString() + ')';
        const radius = 1 + (this.curTime / this.duration) * 2;
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.arc(this.x[i], this.y[i], radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    shouldDestroy = () => {
        return this.curTime > this.duration;
    }
}

class CaptureEffectState {
    constructor(x, y, width, duration, velY) {
        this.curTime = 0;
        this.x0 = x
        this.x1 = x + width
        this.startY = y
        this.startVelY = velY
        this.x = []
        this.y = []
        this.velY = []
        this.rot = []
        this.durations = []
        this.duration = duration;
        this.curTime = 0
    }

    addParticle = () => {
        this.x.push(randomRange(this.x0, this.x1))
        this.y.push(this.startY)
        this.rot.push(randomRange(0, 360))
        this.velY.push(randomRange(this.startVelY - 0.5, this.startVelY + 0.5))
        this.durations.push(0)
    }

    tick = () => {
        for (var i = 0; i < this.durations.length; i++) {
            this.y[i] -= this.velY[i]
            this.rot[i] += 1
            this.durations[i] += 1
            if (this.durations[i] > this.duration) {
                this.x.splice(i, 1)
                this.y.splice(i, 1)
                this.rot.splice(i, 1)
                this.velY.splice(i, 1)
                this.durations.splice(i, 1)
                i -= 1
            }
        }

        this.curTime += 1
        if (this.curTime < 3)
            return
        this.curTime = 0
        this.addParticle()
    }
    
    draw = (ctx) => {
        for (var i = 0; i < this.durations.length; i++) {
            const opacity = 0.5 - (this.durations[i] / this.duration) * 0.5;
            const radius = 10 * opacity
            ctx.fillStyle = 'rgba(255, 255, 255, ' + opacity.toString() + ')';
            ctx.beginPath();
            ctx.lineTo(this.x[i] + radius * Math.sin((0 + this.rot[i]) * Math.PI / 180), this.y[i] + radius * Math.cos((0 + this.rot[i]) * Math.PI / 180))
            ctx.lineTo(this.x[i] + radius * Math.sin((120 + this.rot[i]) * Math.PI / 180), this.y[i] + radius * Math.cos((120 + this.rot[i]) * Math.PI / 180))
            ctx.lineTo(this.x[i] + radius * Math.sin((240 + this.rot[i]) * Math.PI / 180), this.y[i] + radius * Math.cos((240 + this.rot[i]) * Math.PI / 180))
            ctx.fill();
        }
    }
    
    shouldDestroy = () => {
        return false;
    }
}

/*
ctx.lineTo(this.x[i] + radius * Math.sin((0 + this.rot[i]) * Math.PI / 180), this.y[i] + radius * Math.cos((0 + this.rot[i]) * Math.PI / 180))
ctx.lineTo(this.x[i] + radius * Math.sin((120 + this.rot[i]) * Math.PI / 180), this.y[i] + radius * Math.cos((120 + this.rot[i]) * Math.PI / 180))
ctx.lineTo(this.x[i] + radius * Math.sin((240 + this.rot[i]) * Math.PI / 180), this.y[i] + radius * Math.cos((240 + this.rot[i]) * Math.PI / 180))
*/
export { DashEffectState, LandEffectState, AttackEffectState, CaptureEffectState };