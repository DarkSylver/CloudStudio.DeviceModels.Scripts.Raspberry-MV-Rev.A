function parseUplink(device, payload) {
    // Convertir el payload en un objeto JSON
    var parsed = payload.asJsonObject();
    env.log(parsed); // Log para depuración

    // Validar la dirección del dispositivo
    if (parsed.device_address !== "mi_dispositivo") {
        env.log("La dirección del dispositivo no coincide.");
        return;
    }

    // Procesar el contador de personas
    if (parsed.employee_counts && parsed.employee_counts["Cloud Studio"] !== undefined) {
        var peopleCounterEndpoint = device.endpoints.byType(endpointType.peopleCounter);
        if (peopleCounterEndpoint != null) {
            peopleCounterEndpoint.updatePeopleCounterStatus(parsed.employee_counts["Cloud Studio"]);
        }
    } else {
        env.log("El contador de empleados para 'Cloud Studio' no se encontró en el payload.");
    }

    // Procesar el estado del semáforo desde la clave `alert`
    if (parsed.alert) {
        var trafficLightEndpoint = device.endpoints.byAddress("3"); // Endpoint de Luz Tráfico
        if (trafficLightEndpoint != null) {
            switch (parsed.alert) {
                case "Semaforo verde":
                    trafficLightEndpoint.updateValue(1); // 1 representa "Semáforo verde"
                    break;
                case "Semaforo amarillo":
                    trafficLightEndpoint.updateValue(2); // 2 representa "Semáforo amarillo"
                    break;
                case "Semaforo rojo":
                    trafficLightEndpoint.updateValue(3); // 3 representa "Semáforo rojo"
                    break;
                default:
                    env.log("Estado desconocido del semáforo: " + parsed.alert);
            }
        } else {
            env.log("El endpoint 'Luz Tráfico' no existe en el dispositivo.");
        }
    } else {
        env.log("El payload no contiene un estado válido de semáforo en la clave 'alert'.");
    }
}

function buildDownlink(device, endpoint, command, payload) { 
    // Configurar el puerto en el que se reciben comandos
    payload.port = 25;
    payload.buildResult = downlinkBuildResult.ok;

    // Construir el comando basado en el tipo
    if (endpoint && endpoint.address === "3") { // Endpoint de Luz Tráfico
        switch (command.type) {
            case "trafficLightControl":
                switch (command.value) {
                    case "green":
                        payload.setAsBytes([1]); // 1 para "Semáforo verde"
                        break;
                    case "yellow":
                        payload.setAsBytes([2]); // 2 para "Semáforo amarillo"
                        break;
                    case "red":
                        payload.setAsBytes([3]); // 3 para "Semáforo rojo"
                        break;
                    default:
                        payload.buildResult = downlinkBuildResult.unsupported;
                        env.log("Comando desconocido: " + command.value);
                }
                break;
            default:
                payload.buildResult = downlinkBuildResult.unsupported;
                env.log("Tipo de comando no soportado: " + command.type);
        }
    } else {
        payload.buildResult = downlinkBuildResult.unsupported;
        env.log("El endpoint no es válido para comandos de Luz Tráfico.");
    }
}