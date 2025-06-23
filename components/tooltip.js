import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Tooltip from 'react-native-walkthrough-tooltip';

const tooltip = () => {
  const [showTip, setShowTip] = useState(false);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 24 }}>
      <Tooltip
        isVisible={showTip}
        content={<Text>Tu masz tooltipa!</Text>}
        placement="top"
        onClose={() => setShowTip(false)}
      >
        <TouchableOpacity onPress={() => setShowTip(true)}>
          <Text>Przyciśnij mnie</Text>
        </TouchableOpacity>
      </Tooltip>
    </View>
  );
};

export default tooltip;