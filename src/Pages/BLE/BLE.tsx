import React, { useState } from 'react';
import { BluetoothDevice, BluetoothRemoteGATTCharacteristic, BluetoothRemoteGATTServer, IBleProps, RequestDeviceOptions } from './BLE.types';
import { Space, Typography, Button } from 'antd';
import { Layout } from 'antd';
import { dotStream } from 'ldrs'


dotStream.register()


const { Title } = Typography;
const { Content } = Layout;


const contentStyle: React.CSSProperties = {
    textAlign: 'center',
    width: '100%',
    backgroundColor: 'white'
};


const BLE: React.FC<IBleProps> = ({
    readService: readServiceUUID,
    readChar: readCharUUID,
    writeService: writeServiceUUID,
    writeChar: writeCharUUID,
    speed,
    writeValue,
    message
}) => {

    const [device, setDevice] = useState<BluetoothDevice | null>(null);
    const [characteristicValue, setCharacteristicValue] = useState<any>('');
    const [service, setService] = useState<BluetoothRemoteGATTServer | undefined>();
    const [readChar, setReadChar] = useState<BluetoothRemoteGATTCharacteristic>();

    const [isReading, setIsReading] = useState<boolean>(false)

    const readCharacteristic = async () => {
        if (!device) {
            console.error('No device connected');
            alert('Please connect a device first');
            return;
        }
        try {
            if (service) {
                try {

                    await readChar?.startNotifications();
                    readChar?.addEventListener('characteristicvaluechanged', (event) => {
                        const val = (event.target as BluetoothRemoteGATTCharacteristic).value?.buffer;
                        if (val) {
                            const data = new TextDecoder().decode(val);;
                            const arr = data.split(',');
                            setCharacteristicValue(arr);
                        }
                    });
                    setIsReading(!isReading)
                }
                catch (error) {
                    console.error('Failed to read data:', error);
                    alert("Device disconnected")
                }
            }

        } catch (error) {
            console.error('Failed to read characteristic:', error);
            alert("Device disconnected")
        }
    };

    const unixToTimestamp = (unix: string) => {
        try {
            let unix_timestamp = parseInt(unix);
            const myDate = new Date(unix_timestamp * 1000);
            return myDate.toLocaleString()
        } catch (error) {
            console.log("Error in unix to datetime", error);
            return ""
        }
    }

    const connectToDevice = async () => {
        try {
            const options: RequestDeviceOptions = {
                filters: [
                    {
                        namePrefix: "MB"
                    }
                ],
                optionalServices: [readServiceUUID, writeServiceUUID],
            };
            const device = await (navigator as any).bluetooth.requestDevice(options);
            setDevice(device);

            const service = await device.gatt?.connect();
            setService(service);

            const readService = await service.getPrimaryService(readServiceUUID);
            const readChar = await readService.getCharacteristic(readCharUUID);
            setReadChar(readChar)

        } catch (error) {
            console.error('Failed to connect:', error);
        }
    };


    const stopTimer = async () => {
        try {
            await readChar?.stopNotifications();
            setIsReading(!isReading)
        } catch (error) {
            alert("Something went wrong !")
            window.location.reload();
        }
    }

    return (
        <>

            <Layout>
                <Content style={contentStyle}>
                    <Title>{message}</Title>
                    <Space wrap={true} size="large">
                        <Button type="primary" size={'large'} onClick={connectToDevice}>Connect to Device</Button>
                        {device != null ? (
                            <>
                                {isReading ? (
                                        <Button type="primary" size={'large'} onClick={stopTimer}>{"Stop Reading"}</Button>
                                ) : (
                                    <Button type="primary" size={'large'} onClick={readCharacteristic}>{"Start Reading"}</Button>
                                )}
                            </>
                        ) : null}
                    </Space>
                    {device && <p>Connected to device: {device.name}</p>}
                    {characteristicValue && characteristicValue.length > 0 &&
                        <>
                            <Title level={3}> Date Time : {unixToTimestamp(characteristicValue[0])}  </Title>
                            <Title level={3}> Battery Voltage : {characteristicValue[1]} V </Title>
                            <Title level={3}> Battery Current : {characteristicValue[2]} Amp </Title>
                            <Title level={3}> Battery Temprature 1 : {characteristicValue[3]} °C </Title>
                            <Title level={3}> Battery Temprature 2 : {characteristicValue[4]} °F </Title>
                            <Title level={3}> Counter : {characteristicValue[5]} </Title>
                        </>
                    }
                </Content>
            </Layout>

        </>

    );
};

export default BLE;


