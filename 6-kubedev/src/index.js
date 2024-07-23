const k8s = require('@kubernetes/client-node');
const assert = require('assert')

const kc = new k8s.KubeConfig();
kc.loadFromDefault();

function checkConfigWorks() {

}

async function checkNodes() {
    const client = k8s.KubernetesObjectApi.makeApiClient(kc);

    const node = {
        kind: "Node",
        apiVersion: "v1",

    }
    let response
    try {
        response = await client.list("v1", "Node");
    } catch (e) {
        console.error('Nodes not found.')
        return e;
    }
    const node_list = response.body.items;
    assert(node_list.length >= 2, "Not enough nodes in the cluster");
    console.log(node_list)
}

async function checkNamespaces() {
    const client = k8s.KubernetesObjectApi.makeApiClient(kc);

    const namespace = {
        kind: "Namespace",
        apiVersion: "v1",
        metadata: {
            name: 'puzzle6'
        }
    }
    let response
    try {
        response = await client.read(namespace);
    } catch (e) {
        console.error('Namespace not found.')
        return e;
    }
    const live_namespace = response.body

    assert.equal(live_namespace.metadata.labels['puzzleNum'], "num6", "Namespace label missing or wrong value")
    // console.log(live_namespace)
}

async function checkServiceAccount() {
    const client = k8s.KubernetesObjectApi.makeApiClient(kc);

    const sa = {
        kind: "ServiceAccount",
        apiVersion: "v1",
        metadata: {
            name: 'puzzle6-sa'
        }
    }
    let response
    try {
        response = await client.read(sa);
    } catch (e) {
        console.error('ServiceAccount not found.')
        return e;
    }
    const live_namespace = response.body
    // console.log(live_namespace)
}
async function checkRBAC() {

}
async function checkDeployments() {

}
async function checkService() {

}
async function checkHPA() {

}
async function checkDaemonset() {

}
checkNodes();
checkNamespaces();
checkServiceAccount();

console.log(`
Welcome to this challenge!
For this you would need to create a new K8 cluster or use existing one (that you are allowed to play around with)

To pass this test, your cluster and workloads need to match the following requirements:

At least 2 nodes
- specific zone label for each
- one has a taint

Create a namespace called 'puzzle6' with a label key/value puzzle: num6

Create a service account named 'puzzle6-sa'

Create rbac
- permissions to read pods in namespace
create deployment with
- specific image
- resource requirements
- service account
- nodeselector
create hpa for the deployment
- 2x pods min
- scale at 35 cpu
- 10 max
- annotated with something specific
Create a service named 'puzzle6-service' with
- nodeport
- specific annotation

Create a daemonset
- have a toleration
- specific image

Reference material:

https://kubernetes.io/docs/reference/
https://github.com/k3d-io/k3d
https://github.com/kubernetes-sigs/kind
https://minikube.sigs.k8s.io/docs/start/
https://microk8s.io/


`)
