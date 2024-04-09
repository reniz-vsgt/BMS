import React, { useState } from 'react';
import { Divider, Layout, Menu, Space } from 'antd';
import Logo from './logo2.png'
import { Image } from 'antd';
import BLE from '../BLE/BLE';
import Memory from '../Memory/Memory';



const { Header, Content } = Layout;


const Home: React.FC = () => {
    const [selectedKey, setSelectedKey] = useState('stream')

    const stream = {
        readService: "6e400001-b5a3-f393-e0a9-e50e24dcca9e",
        readChar: "6e400003-b5a3-f393-e0a9-e50e24dcca9e",
        writeService: "dd8c1300-3ae2-5c42-b8be-96721cd710fe",
        writeChar: "dd8c1302-3ae2-5c42-b8be-96721cd710fe",
        speed: 250,
        writeValue: '03',
        message: "Read data as stream"
    }

    const memory = {
        readService: "6e400001-b5a3-f393-e0a9-e50e24dcca9f",
        readChar: "6e400003-b5a3-f393-e0a9-e50e24dcca9f",
        writeService: "dd8c1400-3ae2-5c42-b8be-96721cd710fe",
        writeChar: "dd8c1401-3ae2-5c42-b8be-96721cd710fe",
        speed: 100,
        writeValue: '03',
        message: "Read data from memory"
    }


    const items = [
        {
            key: "stream",
            label: "Stream",
            onClick: (e: any) => { setSelectedKey(e.key) }
        },
        {
            key: "memory",
            label: "Memory",
            onClick: (e: any) => { setSelectedKey(e.key) }
        }
    ]


    return (
        <>
            <Header
                style={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 1,
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                }}
            >
                <Space split={<Divider type="vertical" />} align="center">

                    <Image
                        width={200}
                        src={Logo}
                        preview={false}
                    />

                    <Menu
                        theme="dark"
                        mode="horizontal"
                        defaultSelectedKeys={[selectedKey]}
                        items={items}
                    />
                </Space>

            </Header>
            <Content style={{ width: '100%' }}>

                {selectedKey === 'stream' ? (
                    <BLE
                        readService={stream.readService}
                        readChar={stream.readChar}
                        writeService={stream.writeService}
                        writeChar={stream.writeChar}
                        speed={stream.speed}
                        writeValue={stream.writeValue}
                        message={stream.message}
                    />
                ) : (
                    <Memory
                        readService={memory.readService}
                        readChar={memory.readChar}
                        writeService={memory.writeService}
                        writeChar={memory.writeChar}
                        speed={memory.speed}
                        writeValue={memory.writeValue}
                        message={memory.message}
                    />
                )}
            </Content>
        </>

    );
};

export default Home;