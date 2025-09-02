package bridge.state;

public class Override {
    private boolean enabled = false;

    public String getStatus() {
        return enabled ? "override_on" : "override_off";
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }
}
