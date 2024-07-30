import * as THREE from 'three';

let scene, camera, renderer, car;
let obstacles = [], powerUps = [];
let speed = 1, distance = 0;
let lanes = [-2, 0, 2];
let isGameRunning = false;
let isPaused = false;

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const carGeometry = new THREE.BoxGeometry(1, 0.5, 2);
    const carMaterial = new THREE.MeshPhongMaterial({color: 0x00ff00});
    car = new THREE.Mesh(carGeometry, carMaterial);
    car.position.z = -2;
    car.position.y = 0.25;
    scene.add(car);

    const trackGeometry = new THREE.PlaneGeometry(10, 1000);
    const trackMaterial = new THREE.MeshPhongMaterial({color: 0x333333});
    const track = new THREE.Mesh(trackGeometry, trackMaterial);
    track.rotation.x = -Math.PI / 2;
    track.position.z = -300;
    scene.add(track);

    const lineGeometry = new THREE.BoxGeometry(0.1, 0.1, 1000);
    const lineMaterial = new THREE.MeshPhongMaterial({color: 0xffffff});
    const leftLine = new THREE.Mesh(lineGeometry, lineMaterial);
    const rightLine = new THREE.Mesh(lineGeometry, lineMaterial);
    leftLine.position.set(-5, 0.05, -300);
    rightLine.position.set(5, 0.05, -300);
    scene.add(leftLine, rightLine);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(0, 10, 0);
    scene.add(directionalLight);

    camera.position.set(0, 5, 5);
    camera.lookAt(car.position);

    document.getElementById('startButton').addEventListener('click', startGame);
    document.getElementById('resumeButton').addEventListener('click', resumeGame);

    document.addEventListener('keydown', onKeyDown);

    animate();
}

function onKeyDown(event) {
    if (!isGameRunning) return;

    const currentLaneIndex = lanes.indexOf(car.position.x);
    if (event.key === 'ArrowLeft' && currentLaneIndex > 0) {
        car.position.x = lanes[currentLaneIndex - 1];
    } else if (event.key === 'ArrowRight' && currentLaneIndex < lanes.length - 1) {
        car.position.x = lanes[currentLaneIndex + 1];
    } else if (event.code === 'Space') {
        event.preventDefault(); 
        togglePause();
    }
}

function createObstacle() {
    const obstacleGeometry = new THREE.BoxGeometry(1, 1, 1);
    const obstacleMaterial = new THREE.MeshPhongMaterial({color: 0xff0000});
    const obstacle = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
    obstacle.position.set(
        lanes[Math.floor(Math.random() * lanes.length)],
        0.5,
        -50
    );
    obstacles.push(obstacle);
    scene.add(obstacle);
}

function createPowerUp() {
    const powerUpGeometry = new THREE.SphereGeometry(0.5, 30, 30);
    const powerUpMaterial = new THREE.MeshPhongMaterial({color: 0xffff00});
    const powerUp = new THREE.Mesh(powerUpGeometry, powerUpMaterial);
    powerUp.position.set(
        lanes[Math.floor(Math.random() * lanes.length)],
        0.5,
        -50
    );
    powerUps.push(powerUp);
    scene.add(powerUp);
}

function animate() {
    requestAnimationFrame(animate);

    if (isGameRunning && !isPaused) {
        distance += speed * 0.1;
        updateDistanceDisplay();

        if (Math.random() < 0.03) createObstacle();
        if (Math.random() < 0.01) createPowerUp();

      
        for (let i = obstacles.length - 1; i >= 0; i--) {
            obstacles[i].position.z += speed;
            if (obstacles[i].position.z > 5) {
                scene.remove(obstacles[i]);
                obstacles.splice(i, 1);
            } else if (car.position.distanceTo(obstacles[i].position) < 1) {
                speed = Math.max(1, speed - 0.1);
                updateSpeedDisplay();
                scene.remove(obstacles[i]);
                obstacles.splice(i, 1);
            }
        }

        
        for (let i = powerUps.length - 1; i >= 0; i--) {
            powerUps[i].position.z += speed;
            powerUps[i].rotation.y += 0.1;
            if (powerUps[i].position.z > 5) {
                scene.remove(powerUps[i]);
                powerUps.splice(i, 1);
            } else if (car.position.distanceTo(powerUps[i].position) < 1) {
                speed += 0.1;
                updateSpeedDisplay();
                scene.remove(powerUps[i]);
                powerUps.splice(i, 1);
            }
        }
    }

    renderer.render(scene, camera);
}

function startGame() {
    document.getElementById('startScreen').style.display = 'none';
    isGameRunning = true;
    isPaused = false;
    speed = 1;
    distance = 0;
    updateSpeedDisplay();
    updateDistanceDisplay();
}

function togglePause() {
    isPaused = !isPaused;
    document.getElementById('pauseScreen').style.display = isPaused ? 'block' : 'none';
}

function resumeGame() {
    isPaused = false;
    document.getElementById('pauseScreen').style.display = 'none';
}

function updateSpeedDisplay() {
    document.getElementById('speed').textContent = speed.toFixed(1);
}

function updateDistanceDisplay() {
    document.getElementById('distance').textContent = Math.floor(distance);
}

init();