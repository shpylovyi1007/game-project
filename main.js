import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import Hammer from 'hammerjs';

let scene, camera, renderer, car;
let obstacles = [], powerUps = [];
let speed = 1, distance = 0;
let lanes = [-2, 0, 2];
let isGameRunning = false;
let isPaused = false;
let world, carBody, carShape;

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    world = new CANNON.World();
    world.gravity.set(0, -9.82, 0);
    world.broadphase = new CANNON.NaiveBroadphase();
    world.solver.iterations = 10;

    const carGeometry = new THREE.BoxGeometry(1, 0.5, 2);
    const carMaterial = new THREE.MeshPhongMaterial({color: 0x00ff00});
    car = new THREE.Mesh(carGeometry, carMaterial);
    car.position.z = -2;
    car.position.y = 0.25;
    scene.add(car);

    carShape = new CANNON.Box(new CANNON.Vec3(0.5, 0.25, 1));
    carBody = new CANNON.Body({ mass: 1 });
    carBody.addShape(carShape);
    carBody.position.set(car.position.x, car.position.y, car.position.z);
    world.addBody(carBody);

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

    const hammer = new Hammer(document.body);
    hammer.get('swipe').set({ direction: Hammer.DIRECTION_HORIZONTAL });
    hammer.on('swipeleft', () => moveCar('left'));
    hammer.on('swiperight', () => moveCar('right'));

    animate();
}

function moveCar(direction) {
    const currentLaneIndex = lanes.indexOf(car.position.x);
    if (direction === 'left' && currentLaneIndex > 0) {
        carBody.position.x = lanes[currentLaneIndex - 1];
    } else if (direction === 'right' && currentLaneIndex < lanes.length - 1) {
        carBody.position.x = lanes[currentLaneIndex + 1];
    }
}

function onKeyDown(event) {
    if (!isGameRunning) return;

    if (event.key === 'ArrowLeft') {
        moveCar('left');
    } else if (event.key === 'ArrowRight') {
        moveCar('right');
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
    scene.add(obstacle);

    const obstacleShape = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5));
    const obstacleBody = new CANNON.Body({ mass: 0 });
    obstacleBody.addShape(obstacleShape);
    obstacleBody.position.set(obstacle.position.x, obstacle.position.y, obstacle.position.z);
    world.addBody(obstacleBody);

    obstacles.push({ mesh: obstacle, body: obstacleBody });
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
    scene.add(powerUp);

    const powerUpShape = new CANNON.Sphere(0.5);
    const powerUpBody = new CANNON.Body({ mass: 0 });
    powerUpBody.addShape(powerUpShape);
    powerUpBody.position.set(powerUp.position.x, powerUp.position.y, powerUp.position.z);
    world.addBody(powerUpBody);

    powerUps.push({ mesh: powerUp, body: powerUpBody });
}

function animate() {
    requestAnimationFrame(animate);

    if (isGameRunning && !isPaused) {
        distance += speed * 0.1;
        updateDistanceDisplay();

        if (Math.random() < 0.03) createObstacle();
        if (Math.random() < 0.01) createPowerUp();

        world.step(1 / 60);

        car.position.copy(carBody.position);
        car.quaternion.copy(carBody.quaternion);

        for (let i = obstacles.length - 1; i >= 0; i--) {
            const obstacle = obstacles[i];
            obstacle.mesh.position.copy(obstacle.body.position);
            obstacle.mesh.quaternion.copy(obstacle.body.quaternion);
            if (obstacle.body.position.z > 5) {
                scene.remove(obstacle.mesh);
                world.removeBody(obstacle.body);
                obstacles.splice(i, 1);
            } else if (carBody.position.distanceTo(obstacle.body.position) < 1) {
                speed = Math.max(1, speed - 0.1);
                updateSpeedDisplay();
                scene.remove(obstacle.mesh);
                world.removeBody(obstacle.body);
                obstacles.splice(i, 1);
            }
        }

        for (let i = powerUps.length - 1; i >= 0; i--) {
            const powerUp = powerUps[i];
            powerUp.mesh.position.copy(powerUp.body.position);
            powerUp.mesh.quaternion.copy(powerUp.body.quaternion);
            powerUp.mesh.rotation.y += 0.1;
            if (powerUp.body.position.z > 5) {
                scene.remove(powerUp.mesh);
                world.removeBody(powerUp.body);
                powerUps.splice(i, 1);
            } else if (carBody.position.distanceTo(powerUp.body.position) < 1) {
                speed += 0.1;
                updateSpeedDisplay();
                scene.remove(powerUp.mesh);
                world.removeBody(powerUp.body);
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
