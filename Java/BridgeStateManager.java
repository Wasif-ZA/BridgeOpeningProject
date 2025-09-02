package BridgeOpeningProject.Java;

/**
 * Keeps track of WHAT STATE the bridge is in.
 * Think of it as an on-screen status label 😊
 *
 * Add or rename states as needed.
 */
public class BridgeStateManager {

    /** All possible states for our opening bridge. */
    public enum State {
        IDLE,          // Waiting – no traffic, no boats
        OPENING,       // Motors lifting the deck
        OPEN,          // Fully open – boats may pass
        CLOSING,       // Motors lowering the deck
        CLOSED,        // Fully closed – cars/pedestrians may cross
        EMERGENCY      // Something went wrong – stop everything!
    }

    private State current = State.IDLE;

    /** Call this whenever you change what the bridge is doing. */
    public void updateState(State newState) {
        this.current = newState;
        System.out.println("[State] ➜ " + newState);
    }

    /** Ask the manager: “What’s the bridge doing right now?” */
    public State getCurrentState() {
        return current;
    }


    
}