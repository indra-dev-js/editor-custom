const scrollContainer = document.querySelector('.scroll-container');
const scrollContent = document.querySelector('.scroll-content');
const offsetDisplay = document.querySelector('#offsety');

let isScrolling = false;
let currentY = 0;
let lastTouchY;
let lastTime;
let velocityY = 0;
let animationId = null;

const decelerationFactor = 0.96;
const speedMultiplier = 100;

function updatePosition(y) {
  const containerHeight = scrollContainer.offsetHeight;
  const contentHeight = scrollContent.offsetHeight;
  const maxScrollY = 0;
  const minScrollY = (contentHeight > containerHeight) ? containerHeight - contentHeight : 0;
  
  let newY = y;
  
  if (newY > maxScrollY) {
    newY = maxScrollY + (newY - maxScrollY) * 0.5;
  } else if (newY < minScrollY) {
    newY = minScrollY + (newY - minScrollY) * 0.5;
  }
  
  scrollContent.style.transform = `translateY(${newY}px)`;
  currentY = newY;
  offsetDisplay.textContent = `Offset Y: ${Math.round(currentY)}px`;
}

function updateMomentum() {
  velocityY *= decelerationFactor;
  let newY = currentY + velocityY;
  
  updatePosition(newY);
  
  if (Math.abs(velocityY) > 0.5) {
    animationId = requestAnimationFrame(updateMomentum);
  } else {
    animationId = null;
    snapToBounds();
  }
}

function snapToBounds() {
  const containerHeight = scrollContainer.offsetHeight;
  const contentHeight = scrollContent.offsetHeight;
  const minScrollY = (contentHeight > containerHeight) ? containerHeight - contentHeight : 0;
  
  if (currentY > 0) {
    scrollContent.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    scrollContent.style.transform = `translateY(0px)`;
    currentY = 0;
  } else if (currentY < minScrollY) {
    scrollContent.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    scrollContent.style.transform = `translateY(${minScrollY}px)`;
    currentY = minScrollY;
  }
}

function getAverageY(touches) {
  let totalY = 0;
  for (let i = 0; i < touches.length; i++) {
    totalY += touches[i].clientY;
  }
  return totalY / touches.length;
}

// 1. Event Sentuhan Dimulai
scrollContainer.addEventListener('touchstart', (e) => {
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
  
  scrollContent.style.transition = 'none';
  
  isScrolling = true;
  lastTouchY = getAverageY(e.touches);
  lastTime = Date.now();
});

// 2. Event Jari Bergerak
document.addEventListener('touchmove', (e) => {
  if (!isScrolling) return;
  e.preventDefault();
  
  const averageY = getAverageY(e.touches);
  
  const currentTime = Date.now();
  const deltaTime = currentTime - lastTime;
  
  const deltaY = averageY - lastTouchY;
  
  // Perbaiki logika untuk menghilangkan jeda
  if (deltaTime > 0) {
    const newVelocity = deltaY / deltaTime * speedMultiplier;
    
    if (Math.sign(newVelocity) !== Math.sign(velocityY) && Math.abs(newVelocity) > 5) {
      velocityY = newVelocity;
    } else {
      const touchSpeed = Math.abs(newVelocity);
      const momentumSpeed = Math.abs(velocityY);
      
      // Bobot kecepatan baru lebih besar untuk sentuhan halus
      velocityY = velocityY * 0.3 + newVelocity * 0.7;
    }
  }
  
  lastTouchY = averageY;
  lastTime = currentTime;
  
  const newY = currentY + deltaY;
  updatePosition(newY);
});

// 3. Event Sentuhan Berakhir
document.addEventListener('touchend', () => {
  isScrolling = false;
  
  if (Math.abs(velocityY) > 2) {
    if (!animationId) {
      animationId = requestAnimationFrame(updateMomentum);
    }
  } else {
    snapToBounds();
  }
});

document.addEventListener('touchcancel', () => {
  isScrolling = false;
  snapToBounds();
});