// Canvas setup
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Set canvas dimensions (A1 = 594 × 841 mm ≈ 2245 × 3179 px)
// However, we're using 1920px height as requested
const width = 1350; // Approximate width to maintain A1 ratio with 1920px height
const height = 1920;
canvas.width = width;
canvas.height = height;

// Emblem information
let emblemImage = new Image();
emblemImage.src = 'emblem.svg'; // Path to your SVG emblem
let emblemLoaded = false;
let emblemData = null;
let emblemPixels = [];

// Particle settings
const colors = ['#ff0000', '#0000ff', '#ffff00']; // Red, Blue, Yellow
const particleCount = 1500;
const particles = [];
let animationPhase = 'expand'; // 'expand', 'converge', 'final'

// Initialize when emblem loads
emblemImage.onload = function() {
    emblemLoaded = true;
    // Get emblem data
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    
    // Size for analysis (smaller for performance)
    const analyzeWidth = 300;
    const analyzeHeight = 300;
    
    tempCanvas.width = analyzeWidth;
    tempCanvas.height = analyzeHeight;
    
    // Draw emblem to analyze positions
    tempCtx.fillStyle = '#ffffff';
    tempCtx.fillRect(0, 0, analyzeWidth, analyzeHeight);
    
    // Center and scale the emblem
    const scale = Math.min(analyzeWidth / emblemImage.width, analyzeHeight / emblemImage.height) * 0.8;
    const x = (analyzeWidth - emblemImage.width * scale) / 2;
    const y = (analyzeHeight - emblemImage.height * scale) / 2;
    
    tempCtx.drawImage(emblemImage, x, y, emblemImage.width * scale, emblemImage.height * scale);
    
    // Get image data
    emblemData = tempCtx.getImageData(0, 0, analyzeWidth, analyzeHeight);
    
    // Find points where emblem is drawn (black pixels)
    for (let y = 0; y < analyzeHeight; y += 2) { // Sample every other pixel for performance
        for (let x = 0; x < analyzeWidth; x += 2) {
            const i = (y * analyzeWidth + x) * 4;
            // If the pixel is dark (part of the emblem)
            if (emblemData.data[i] < 128) {
                emblemPixels.push({
                    x: (x / analyzeWidth) * width,
                    y: (y / analyzeHeight) * height
                });
            }
        }
    }
    
    // Initialize particles
    initParticles();
    
    // Start animation
    animate();
};

// Create particles
function initParticles() {
    // Create random particles in center
    for (let i = 0; i < particleCount; i++) {
        const color = colors[Math.floor(Math.random() * colors.length)];
        particles.push({
            x: width / 2,
            y: height / 2,
            size: Math.random() * 3 + 2,
            color: color,
            vx: (Math.random() - 0.5) * 10, // Random velocity for expansion
            vy: (Math.random() - 0.5) * 10,
            targetX: 0,
            targetY: 0,
            assigned: false
        });
    }
    
    // Schedule animation phases
    setTimeout(() => {
        animationPhase = 'converge';
        assignTargets();
    }, 3000); // After 3 seconds, start converging
    
    setTimeout(() => {
        animationPhase = 'final';
    }, 6000); // After 6 seconds, finalize positions
}

// Assign emblem target positions to particles
function assignTargets() {
    // For each particle, find a position in the emblem
    particles.forEach((particle, index) => {
        if (emblemPixels.length > 0) {
            // Get random emblem position or use index (clamped to available positions)
            const targetIndex = index % emblemPixels.length;
            particle.targetX = emblemPixels[targetIndex].x;
            particle.targetY = emblemPixels[targetIndex].y;
            particle.assigned = true;
        }
    });
}

// Animation loop
function animate() {
    // Clear canvas
    ctx.fillStyle = '#f1f1f1';
    ctx.fillRect(0, 0, width, height);
    
    // Update and draw particles
    particles.forEach(particle => {
        // Update position based on current animation phase
        if (animationPhase === 'expand') {
            // Move outward from center
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            // Bounce off edges
            if (particle.x < 0 || particle.x > width) particle.vx *= -0.8;
            if (particle.y < 0 || particle.y > height) particle.vy *= -0.8;
            
            // Add friction
            particle.vx *= 0.99;
            particle.vy *= 0.99;
        } 
        else if (animationPhase === 'converge' || animationPhase === 'final') {
            if (particle.assigned) {
                // Move toward target position
                const dx = particle.targetX - particle.x;
                const dy = particle.targetY - particle.y;
                
                // Determine speed based on phase
                const speed = animationPhase === 'converge' ? 0.05 : 0.2;
                
                particle.x += dx * speed;
                particle.y += dy * speed;
            }
        }
        
        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.fill();
    });
    
    // Continue animation
    requestAnimationFrame(animate);
}