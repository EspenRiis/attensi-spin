import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import './QuizRaceView.css';

/**
 * QuizRaceView - 3D racing visualization for quiz gameplay
 * Integrates with existing useQuizGame hook for real-time updates
 */
const QuizRaceView = ({ sessionId, participantId, gameState, players = [] }) => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const animationFrameRef = useRef(null);
  const vehiclesRef = useRef(new Map());
  const trackPathRef = useRef([]);

  const [sceneReady, setSceneReady] = useState(false);

  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current) return;

    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    scene.fog = new THREE.Fog(0x1a1a2e, 50, 200);
    sceneRef.current = scene;

    // Create camera
    const camera = new THREE.PerspectiveCamera(
      60,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 15, 30);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Create renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    scene.add(directionalLight);

    // Create basic track
    createTrack(scene);

    // Handle window resize
    const handleResize = () => {
      if (!mountRef.current || !camera || !renderer) return;

      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    setSceneReady(true);

    // Animation loop
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);

      // Update vehicle positions based on game state
      updateVehiclePositions();

      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Create a simple circular track
  const createTrack = (scene) => {
    const trackRadius = 20;
    const trackWidth = 4;
    const segments = 64;

    // Track path for positioning vehicles
    const trackPath = [];
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      trackPath.push(
        new THREE.Vector3(
          Math.cos(angle) * trackRadius,
          0,
          Math.sin(angle) * trackRadius
        )
      );
    }
    trackPathRef.current = trackPath;

    // Create track geometry
    const trackShape = new THREE.Shape();
    const innerRadius = trackRadius - trackWidth / 2;
    const outerRadius = trackRadius + trackWidth / 2;

    // Outer circle
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const x = Math.cos(angle) * outerRadius;
      const y = Math.sin(angle) * outerRadius;
      if (i === 0) trackShape.moveTo(x, y);
      else trackShape.lineTo(x, y);
    }

    // Inner circle (hole)
    const holePath = new THREE.Path();
    for (let i = segments; i >= 0; i--) {
      const angle = (i / segments) * Math.PI * 2;
      const x = Math.cos(angle) * innerRadius;
      const y = Math.sin(angle) * innerRadius;
      if (i === segments) holePath.moveTo(x, y);
      else holePath.lineTo(x, y);
    }
    trackShape.holes.push(holePath);

    const trackGeometry = new THREE.ShapeGeometry(trackShape);
    const trackMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.8,
      metalness: 0.2,
    });
    const trackMesh = new THREE.Mesh(trackGeometry, trackMaterial);
    trackMesh.rotation.x = -Math.PI / 2;
    trackMesh.receiveShadow = true;
    scene.add(trackMesh);

    // Add track center lines
    const lineGeometry = new THREE.BufferGeometry().setFromPoints(trackPath);
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffff00 });
    const line = new THREE.Line(lineGeometry, lineMaterial);
    scene.add(line);

    // Ground plane
    const groundGeometry = new THREE.PlaneGeometry(200, 200);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x0a0a15,
      roughness: 1,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.1;
    ground.receiveShadow = true;
    scene.add(ground);
  };

  // Create or update vehicles for players
  useEffect(() => {
    if (!sceneReady || !sceneRef.current) return;

    const scene = sceneRef.current;

    // Update vehicles for each player
    players.forEach((player, index) => {
      if (!vehiclesRef.current.has(player.id || player.participant_id)) {
        // Create new vehicle for this player
        const vehicle = createVehicle(player, index);
        vehiclesRef.current.set(player.id || player.participant_id, vehicle);
        scene.add(vehicle);
      }
    });

    // Remove vehicles for players no longer in the game
    const currentPlayerIds = new Set(players.map(p => p.id || p.participant_id));
    vehiclesRef.current.forEach((vehicle, playerId) => {
      if (!currentPlayerIds.has(playerId)) {
        scene.remove(vehicle);
        vehiclesRef.current.delete(playerId);
      }
    });
  }, [players, sceneReady]);

  // Create a simple vehicle (cube for now)
  const createVehicle = (player, index) => {
    const group = new THREE.Group();

    // Vehicle body
    const bodyGeometry = new THREE.BoxGeometry(1.5, 1, 2.5);
    const colors = [
      0xff0000, 0x00ff00, 0x0000ff, 0xffff00,
      0xff00ff, 0x00ffff, 0xff8800, 0x8800ff
    ];
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: colors[index % colors.length],
      metalness: 0.6,
      roughness: 0.4,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.5;
    body.castShadow = true;
    group.add(body);

    // Store player data
    group.userData.playerId = player.id || player.participant_id;
    group.userData.position = 0; // Position along track (0-1)
    group.userData.score = player.score || 0;

    return group;
  };

  // Update vehicle positions based on game state
  const updateVehiclePositions = () => {
    if (!sceneRef.current || trackPathRef.current.length === 0) return;

    const trackPath = trackPathRef.current;
    const trackLength = trackPath.length - 1;

    vehiclesRef.current.forEach((vehicle) => {
      // Get player data
      const player = players.find(p =>
        (p.id || p.participant_id) === vehicle.userData.playerId
      );

      if (!player) return;

      // Update position based on score (higher score = further along track)
      const maxScore = Math.max(...players.map(p => p.score || 0), 1);
      const progress = (player.score || 0) / maxScore;
      vehicle.userData.position = progress;

      // Get position on track
      const trackIndex = Math.floor(progress * trackLength);
      const nextIndex = Math.min(trackIndex + 1, trackLength);
      const localProgress = (progress * trackLength) - trackIndex;

      const currentPoint = trackPath[trackIndex];
      const nextPoint = trackPath[nextIndex];

      // Interpolate position
      vehicle.position.x = THREE.MathUtils.lerp(
        currentPoint.x,
        nextPoint.x,
        localProgress
      );
      vehicle.position.y = 0.5; // Keep above track
      vehicle.position.z = THREE.MathUtils.lerp(
        currentPoint.z,
        nextPoint.z,
        localProgress
      );

      // Rotate to face direction of travel
      const direction = new THREE.Vector3()
        .subVectors(nextPoint, currentPoint)
        .normalize();
      if (direction.length() > 0) {
        const angle = Math.atan2(direction.x, direction.z);
        vehicle.rotation.y = angle;
      }
    });

    // Update camera to follow leader
    if (cameraRef.current && players.length > 0) {
      const leader = players.reduce((prev, current) =>
        (current.score || 0) > (prev.score || 0) ? current : prev
      );
      const leaderVehicle = vehiclesRef.current.get(leader.id || leader.participant_id);

      if (leaderVehicle) {
        // Smooth camera follow
        const targetPos = leaderVehicle.position.clone();
        targetPos.y += 15;
        targetPos.z += 30;

        cameraRef.current.position.lerp(targetPos, 0.05);
        cameraRef.current.lookAt(leaderVehicle.position);
      }
    }
  };

  return (
    <div className="quiz-race-view">
      <div ref={mountRef} className="race-canvas-container" />

      {/* HUD overlay */}
      <div className="race-hud">
        <div className="race-info">
          <h3>Quiz Race</h3>
          <p>Session: {sessionId}</p>
          {gameState?.currentQuestion && (
            <p>Question {gameState.currentQuestionIndex + 1}</p>
          )}
        </div>

        {/* Leaderboard */}
        <div className="race-leaderboard">
          <h4>Leaderboard</h4>
          {players
            .sort((a, b) => (b.score || 0) - (a.score || 0))
            .slice(0, 5)
            .map((player, index) => (
              <div key={player.id || player.participant_id} className="leaderboard-item">
                <span className="position">{index + 1}</span>
                <span className="name">{player.username || player.name}</span>
                <span className="score">{player.score || 0}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default QuizRaceView;
