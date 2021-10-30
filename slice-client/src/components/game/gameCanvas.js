import React, { useEffect, useRef } from 'react';
import { gameWorld } from '../../gameclasses/gameWorld';
import './css/gameCanvas.css'

const GameCanvas = props => {
    // Reference to canvas
    const canvasRef = useRef(null);
    useEffect(() => {
        // Get the actual canvas reference and the context of the canvas
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        const draw = () => {
            if(gameWorld === null)
                return;
                
            gameWorld.doTicks();
            gameWorld.draw(ctx);
            requestAnimationFrame(draw);
        }
        draw();
    }, [])

    // Return the canvas DOM element
    return <canvas ref ={canvasRef} id='gamecanvas' width={gameWorld.width} height={gameWorld.height}/>
}

export default GameCanvas;