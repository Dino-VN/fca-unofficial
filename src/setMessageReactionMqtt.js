"use strict";

const {
  generateOfflineThreadingID,
  getCurrentTimestamp,
} = require("dinovn-fca/utils");

function isCallable(func) {
  try {
    Reflect.apply(func, null, []);
    return true;
  } catch (error) {
    return false;
  }
}

module.exports = function (defaultFuncs, api, ctx) {
  return function setMessageReactionMqtt(
    reaction,
    messageID,
    threadID,
    callback,
  ) {
    if (!ctx.mqttClient) {
      throw new Error("Not connected to MQTT");
    }

    ctx.wsReqNumber += 1;
    let taskNumber = ++ctx.wsTaskNumber;

    const taskPayload = {
      thread_key: threadID,
      timestamp_ms: getCurrentTimestamp(),
      message_id: messageID,
      reaction: reaction,
      actor_id: ctx.userID,
      reaction_style: null,
      sync_group: 1,
      send_attribution: Math.random() < 0.5 ? 65537 : 524289,
    };

    const task = {
      failure_count: null,
      label: "29",
      payload: JSON.stringify(taskPayload),
      queue_name: JSON.stringify(["reaction", messageID]),
      task_id: taskNumber,
    };

    const content = {
      app_id: "2220391788200892",
      payload: JSON.stringify({
        data_trace_id: null,
        epoch_id: parseInt(generateOfflineThreadingID()),
        tasks: [task],
        version_id: "7158486590867448",
      }),
      request_id: ctx.wsReqNumber,
      type: 3,
    };

    if (isCallable(callback)) {
      ctx["tasks"].set(taskNumber, {
        type: "set_message_reaction",
        callback: callback,
      });
    }
    ctx.mqttClient.publish("/ls_req", JSON.stringify(content), {
      qos: 1,
      retain: false,
    });
  };
};
