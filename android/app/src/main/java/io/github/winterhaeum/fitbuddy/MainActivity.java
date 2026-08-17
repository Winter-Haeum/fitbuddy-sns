package io.github.winterhaeum.fitbuddy;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    registerPlugin(DailyStepsPlugin.class);
    super.onCreate(savedInstanceState);
  }
}
