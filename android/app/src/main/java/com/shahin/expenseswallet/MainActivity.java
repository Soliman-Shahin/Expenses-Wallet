package com.shahin.expenseswallet;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        registerPlugin(DeviceLockPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
