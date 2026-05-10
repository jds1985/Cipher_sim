import * as IPFS from 'ipfs-core'
import OrbitDB from 'orbit-db'

/**
 * THE CIPHER SUBSTRATE INITIALIZER
 * This turns the local device into a P2P node.
 */
export async function initCipherNode() {
    try {
        // 1. Initialize the IPFS node (The transport layer)
        // We use a custom repo path so it doesn't conflict with other apps
        const ipfs = await IPFS.create({ 
            repo: './cipher-substrate-v1',
            config: {
                Addresses: {
                    Swarm: [
                        // These are public signaling servers that help nodes find each other
                        '/dns4/wrtc-star1.par.dwebops.pub/tcp/443/wss/p2p-webrtc-star',
                        '/dns4/wrtc-star2.sjc.dwebops.pub/tcp/443/wss/p2p-webrtc-star'
                    ]
                }
            }
        });

        // 2. Initialize OrbitDB on top of IPFS
        const orbitdb = await OrbitDB.createInstance(ipfs);

        // 3. Open (or create) the Founding 100 Ledger
        // Access controller ensures only you can 'validate' the final nodes
        const options = {
            accessController: {
                write: ['*'] // For the launch, we let the mesh write pre-orders
            }
        };

        const db = await orbitdb.docs('cipher-founding-nodes', options);
        
        // 4. Load the local database
        await db.load();

        console.log("Cipher Substrate Online. Node Address:", db.address.toString());
        
        return { db, orbitdb, ipfs };

    } catch (e) {
        console.error("Substrate Failure:", e);
        return null;
    }
}
