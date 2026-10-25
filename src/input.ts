// Mutable input shared by the joystick (UI) and the sim (scene). Dependency-free so the UI never pulls in three.
export const input = { joyX: 0, joyY: 0 } // -1..1; joyY > 0 = forward
