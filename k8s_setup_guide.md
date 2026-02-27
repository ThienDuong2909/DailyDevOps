# 🚀 Hướng dẫn Cài đặt lại K3s & GitOps Pipeline

> **Dự án:** DevOps Blog (client + server-nodejs)  
> **Trạng thái hiện tại:** Jenkins chỉ đang chạy được stage `Docker Build & Push`  
> **Mục tiêu:** Hoàn thiện toàn bộ pipeline: CI (Jenkins) → Docker Hub → GitOps (Blog_K8S) → K3s Deploy

---

## ⚠️ Phần 0: TIỀN KIỂM TRA trước khi cài K3s (QUAN TRỌNG)

> Bạn đang chạy các dịch vụ Docker Compose (MySQL, Redis, API server, Adminer) trên cùng VPS.
> **Bỏ qua phần này có thể khiến K3s conflict với các service hiện tại và làm sập toàn bộ hệ thống.**

### 0.1 Kiểm tra Port Conflict

K3s và Traefik (ingress controller tích hợp sẵn) sẽ chiếm các port sau:

| Port            | Service K3s                 | Rủi ro conflict với VPS của bạn         |
| --------------- | --------------------------- | --------------------------------------- |
| **80**          | Traefik HTTP                | ⚠️ Nếu đang dùng Nginx/Apache trực tiếp |
| **443**         | Traefik HTTPS               | ⚠️ Nếu đang dùng Nginx/Apache trực tiếp |
| **6443**        | K3s API Server              | ✅ Thường không conflict                |
| **8472/UDP**    | Flannel VXLAN (CNI)         | ✅ Thường không conflict                |
| **10250**       | Kubelet metrics             | ✅ Thường không conflict                |
| **10251/10252** | kube-scheduler / controller | ✅ Thường không conflict                |
| **2379/2380**   | etcd (nếu cài HA)           | ✅ Không dùng với single node           |

```bash
# Kiểm tra port nào đang được sử dụng trên VPS
sudo ss -tlnp | grep -E ':80|:443|:6443|:8472|:10250'

# Hoặc dùng netstat
sudo netstat -tlnp | grep -E ':80 |:443 '

# Xem danh sách đầy đủ các port đang mở
sudo ss -tlnp
```

> **Với setup Docker Compose của bạn:**
>
> - Port 3000, 3001, 3306, 6379, 8080 đang được Docker Compose bind trực tiếp
> - Traefik K3s **KHÔNG** conflict với các port này vì đây là port của container
> - **Rủi ro duy nhất:** nếu VPS đang chạy thêm Nginx/Apache bên ngoài Docker và bind port 80/443

```bash
# Kiểm tra xem có Nginx hay Apache KHÔNG chạy trong container đang dùng port 80/443 không
sudo systemctl status nginx 2>/dev/null || echo "Nginx: not installed"
sudo systemctl status apache2 2>/dev/null || echo "Apache: not installed"

# Kiểm tra process nào đang chiếm port 80
sudo lsof -i :80
sudo lsof -i :443
```

**Xử lý nếu Nginx/Apache đang chiếm port 80/443:**

```bash
# Phương án 1: Dừng Nginx trên host (Traefik của K3s sẽ thay thế)
sudo systemctl stop nginx && sudo systemctl disable nginx

# Phương án 2: Đổi Traefik K3s sang port khác (ví dụ 8000/8443)
# → Xem hướng dẫn ở mục 0.5 bên dưới
```

---

### 0.2 Kiểm tra Docker Daemon Conflict

> K3s dùng **containerd** riêng, KHÔNG dùng Docker daemon. Tuy nhiên vẫn có thể có xung đột về iptables/network.

```bash
# Kiểm tra Docker đang chạy
sudo systemctl status docker

# Xem Docker networks hiện tại
docker network ls

# Xem subnet Docker đang dùng
docker network inspect bridge | grep Subnet
# Thường là: 172.17.0.0/16
```

> **Biết để tránh:** K3s Flannel mặc định dùng subnet `10.42.0.0/16` (Pod CIDR) và `10.43.0.0/16` (Service CIDR).
> Đây thường **không conflict** với Docker bridge `172.17.0.0/16`, nhưng kiểm tra lại nếu bạn cấu hình Docker network tùy chỉnh.

```bash
# Kiểm tra route table để phát hiện overlap subnet
ip route show

# Nếu bạn thấy 10.42.x.x hoặc 10.43.x.x đã có, hãy dùng CIDR khác khi cài K3s:
# curl -sfL https://get.k3s.io | INSTALL_K3S_EXEC="--cluster-cidr=10.244.0.0/16 --service-cidr=10.245.0.0/16" sh -
```

---

### 0.3 Kiểm tra iptables Conflict

> K3s tự thêm iptables rules. Nếu VPS dùng `ufw` hoặc `firewalld`, cần mở các port sau:

```bash
# Kiểm tra firewall đang dùng loại gì
sudo ufw status 2>/dev/null
sudo systemctl status firewalld 2>/dev/null

# --- Nếu dùng UFW ---
# Mở port cho K3s API server và Traefik
sudo ufw allow 6443/tcp    # K3s API server
sudo ufw allow 80/tcp      # Traefik HTTP
sudo ufw allow 443/tcp     # Traefik HTTPS
sudo ufw allow 8472/udp    # Flannel VXLAN
sudo ufw allow 10250/tcp   # Kubelet

# --- Nếu dùng firewalld ---
sudo firewall-cmd --permanent --add-port=6443/tcp
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --permanent --add-port=8472/udp
sudo firewall-cmd --permanent --add-port=10250/tcp
sudo firewall-cmd --reload
```

---

### 0.4 Kiểm tra DNS Conflict (systemd-resolved)

> K3s chạy CoreDNS trên port 53 **bên trong cluster** (không phải host). Tuy nhiên `systemd-resolved` trên Ubuntu có thể conflict.

```bash
# Kiểm tra systemd-resolved
sudo systemctl status systemd-resolved

# Kiểm tra port 53 trên host
sudo ss -ulnp | grep :53

# Nếu systemd-resolved chiếm port 53 trên 0.0.0.0 → cần cấu hình
# (K3s thường xử lý được, nhưng nếu gặp lỗi DNS thì làm bước này)
sudo sed -i 's/#DNSStubListener=yes/DNSStubListener=no/' /etc/systemd/resolved.conf
sudo systemctl restart systemd-resolved
```

---

### 0.5 Kiểm tra RAM & CPU đủ không

```bash
# Xem RAM hiện tại đang dùng bao nhiêu
free -h

# Xem CPU load
top -bn1 | head -5

# Xem disk trống
df -h /
```

**Tham chiếu RAM của setup bạn:**

| Service                                | RAM ước tính     |
| -------------------------------------- | ---------------- |
| MySQL 8.0                              | ~300-500MB       |
| Node.js Server API                     | ~100-200MB       |
| Next.js Client                         | ~150-250MB       |
| Redis                                  | ~50MB            |
| Adminer                                | ~30MB            |
| Jenkins (nếu cùng VPS)                 | ~500MB-1GB       |
| **Docker Compose tổng**                | **~1.1 - 2GB**   |
| K3s core (API server + etcd + kubelet) | ~500-800MB       |
| Traefik (ingress)                      | ~50-100MB        |
| cert-manager                           | ~100MB           |
| ArgoCD                                 | ~300-500MB       |
| **K3s components tổng**                | **~1 - 1.5GB**   |
| **TỔNG CỘNG**                          | **~2.1 - 3.5GB** |

> ⚠️ **Khuyến nghị tối thiểu: RAM 4GB** nếu chạy tất cả trên cùng VPS.
> Nếu RAM < 4GB: cân nhắc **không cài ArgoCD** và dùng kubectl apply thủ công, hoặc tách Jenkins ra VPS riêng.

---

### 0.6 Quyết định chiến lược cài K3s

Dựa vào kiểm tra trên, chọn một trong 3 phương án:

| Phương án                                     | Điều kiện áp dụng                             | Ghi chú          |
| --------------------------------------------- | --------------------------------------------- | ---------------- |
| **A: Cài K3s bình thường**                    | VPS ≥ 4GB RAM, không có Nginx/Apache host     | ✅ Đơn giản nhất |
| **B: Cài K3s không có Traefik** (tự cấu hình) | Đang dùng Nginx làm reverse proxy trên host   | Phức tạp hơn     |
| **C: Cài K3s trên VPS mới/riêng**             | VPS hiện tại < 4GB RAM hoặc quá nhiều service | ✅ An toàn nhất  |

> **Với setup của bạn (Docker Compose + không có Nginx host):** → Chọn **Phương án A**

---

## 📊 Sơ đồ tổng quan kiến trúc

```
GitHub Push
    │
    ▼
Jenkins CI Pipeline
    ├─ Checkout Source Code
    ├─ Install Dependencies
    ├─ Inject Env Secrets
    ├─ SonarQube Analysis
    ├─ Quality Gate
    ├─ Docker Build & Push  ✅ (đang hoạt động)
    └─ Update K8s Manifest  ──▶ repo: ThienDuong2909/Blog_K8S
                                        │
                                        ▼
                                   ArgoCD (GitOps)
                                        │
                                        ▼
                                   K3s Cluster
                                        ├─ Traefik (Ingress)
                                        ├─ cert-manager (TLS)
                                        ├─ devops-blog-client
                                        └─ devops-blog-server
```

---

## Phần 1: Cài đặt K3s trên VPS

### 1.1 Yêu cầu

- VPS Linux (Ubuntu 22.04 LTS khuyến nghị)
- RAM **tối thiểu 4GB** (vì đang chạy thêm Docker Compose services)
- CPU: 2 cores
- Domain trỏ đúng IP: `blog.thienduong.info`, `api.thienduong.info`
- Đã hoàn thành checklist ở **Phần 0** bên trên

### 1.2 Cài đặt K3s (Phương án A — an toàn với Docker Compose hiện tại)

> K3s đã tích hợp sẵn Traefik làm Ingress Controller. **Không cần cài thêm.**  
> Lệnh dưới đây cài K3s với các flag bảo vệ để tránh conflict với Docker và services hiện tại.

```bash
# SSH vào VPS
ssh user@your-vps-ip

# ── Bước 1: Tắt swap (K3s yêu cầu) ──
sudo swapoff -a
# Tắt vĩnh viễn (comment dòng swap trong /etc/fstab)
sudo sed -i '/ swap / s/^\(.*\)$/#\1/g' /etc/fstab

# ── Bước 2: Cài K3s với các flag an toàn ──
curl -sfL https://get.k3s.io | INSTALL_K3S_EXEC="\
  --write-kubeconfig-mode=644 \
  --disable=servicelb \
  --kube-apiserver-arg=service-node-port-range=30000-32767
" sh -

# Giải thích các flag:
# --write-kubeconfig-mode=644   → Cho phép user không phải root dùng kubectl
# --disable=servicelb           → Tắt ServiceLB (dùng Traefik làm LB thay thế)
# --kube-apiserver-arg=...      → Giới hạn NodePort range, tránh conflict port random
```

```bash
# ── Bước 3: Kiểm tra K3s đã chạy chưa ──
sudo systemctl status k3s

# Kiểm tra node Ready
sudo kubectl get nodes
# Output mong đợi: STATUS = Ready

# Kiểm tra Traefik đã chạy chưa
sudo kubectl get pods -n kube-system | grep traefik
# Output mong đợi: traefik-xxxx   1/1   Running

# Kiểm tra port 80 và 443 của Traefik có hoạt động không
sudo ss -tlnp | grep -E ':80|:443'
# Output mong đợi: thấy process 'traefik' hoặc 'k3s'
```

```bash
# ── Bước 4: Xác nhận Docker Compose services vẫn còn sống ──
docker ps
# Tất cả container (mysql, server, client, adminer, redis) phải vẫn UP

# Test ping service nội bộ
curl -s http://localhost:3001/health || echo "Server API: check manually"
curl -s http://localhost:3000 | head -5 || echo "Client: check manually"
```

> ✅ **Nếu Docker containers vẫn UP → K3s cài thành công và KHÔNG conflict**

### 1.3 Cấu hình kubectl không cần sudo

```bash
# Trên VPS (cách nhanh nhất)
mkdir -p ~/.kube
sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
sudo chown $(id -u):$(id -g) ~/.kube/config

# Test không cần sudo
kubectl get nodes
```

### 1.4 Cấu hình kubectl từ máy local (tuỳ chọn)

```bash
# Trên máy local Windows (PowerShell)
mkdir -Force ~/.kube
scp user@your-vps-ip:/etc/rancher/k3s/k3s.yaml ~/.kube/config

# Sửa IP: thay 127.0.0.1 → IP VPS thực tế
(Get-Content ~/.kube/config) -replace '127.0.0.1', 'YOUR_VPS_IP' | Set-Content ~/.kube/config

# Test kết nối
kubectl get nodes
```

---

## Phần 2: Cài đặt cert-manager (TLS tự động với Let's Encrypt)

> **Vì sao cần:** File `ingress.yaml` của bạn dùng annotation `cert-manager.io/cluster-issuer: letsencrypt-prod`

### 2.1 Cài cert-manager

```bash
# Cài cert-manager phiên bản mới nhất
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.14.4/cert-manager.yaml

# Đợi các pod sẵn sàng (khoảng 60 giây)
kubectl wait --for=condition=ready pod -l app.kubernetes.io/instance=cert-manager -n cert-manager --timeout=120s

# Kiểm tra
kubectl get pods -n cert-manager
```

### 2.2 Tạo ClusterIssuer Let's Encrypt

```bash
cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: your-email@thienduong.info
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: traefik
EOF
```

```bash
# Kiểm tra ClusterIssuer đã Ready chưa
kubectl get clusterissuer letsencrypt-prod
# STATUS phải là: True (Ready)
```

---

## Phần 3: Tạo cấu trúc repo Blog_K8S trên GitHub

> **Jenkinsfile yêu cầu:** Repo `ThienDuong2909/Blog_K8S` với file `deployment.yaml` trong **root**  
> **Stage Update K8s Manifest** sẽ dùng `sed` để update dòng `image:` trong file này

### 3.1 Cấu trúc repo Blog_K8S

```
Blog_K8S/
├── deployment.yaml      ← Jenkins sẽ UPDATE file này (client)
├── service.yaml
├── ingress.yaml
├── server/
│   ├── deployment.yaml  ← Jenkins sẽ UPDATE file này (server)
│   ├── service.yaml
│   └── ingress.yaml
└── README.md
```

> ⚠️ **Quan trọng:** Xem lại Jenkinsfile:
>
> - Client: `sed -i 's|image: thienduong2909/devops-blog-client:.*|...|' deployment.yaml`
> - Server: `sed -i 's|image: thienduong2909/devops-blog-server:.*|...|' deployment.yaml`
>
> Cả 2 đều update file `deployment.yaml` ở **root** của repo `k8s-repo`. Nếu muốn server có folder riêng, bạn cần điều chỉnh Jenkinsfile server để `cd server/` trước.

### 3.2 Nội dung deployment.yaml cho Client (đặt ở root repo Blog_K8S)

```yaml
# Blog_K8S/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: devops-blog-client
  namespace: default
spec:
  replicas: 1
  selector:
    matchLabels:
      app: devops-blog-client
  template:
    metadata:
      labels:
        app: devops-blog-client
    spec:
      containers:
        - name: devops-blog-client
          image: thienduong2909/devops-blog-client:latest
          env:
            - name: HOSTNAME
              value: "0.0.0.0"
            - name: PORT
              value: "3000"
          imagePullPolicy: IfNotPresent
          ports:
            - containerPort: 3000
          resources:
            limits:
              memory: "512Mi"
              cpu: "500m"
            requests:
              memory: "256Mi"
              cpu: "250m"
```

### 3.3 Nội dung service.yaml cho Client

```yaml
# Blog_K8S/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: devops-blog-service
  namespace: default
spec:
  selector:
    app: devops-blog-client
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3000
  type: ClusterIP
```

### 3.4 Nội dung ingress.yaml cho Client

```yaml
# Blog_K8S/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: devops-blog-ingress
  namespace: default
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    traefik.ingress.kubernetes.io/router.entrypoints: websecure
spec:
  rules:
    - host: "blog.thienduong.info"
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: devops-blog-service
                port:
                  number: 80
  tls:
    - hosts:
        - blog.thienduong.info
      secretName: devops-blog-tls
```

---

## Phần 4: Cài đặt ArgoCD (GitOps - tự động sync từ Blog_K8S)

> **ArgoCD** sẽ watch repo `Blog_K8S`, khi Jenkins push thay đổi image tag → ArgoCD tự động apply lên K3s

### 4.1 Cài ArgoCD

```bash
# Tạo namespace
kubectl create namespace argocd

# Cài ArgoCD
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Đợi ArgoCD sẵn sàng
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=argocd-server -n argocd --timeout=180s
```

### 4.2 Expose ArgoCD UI qua Ingress (HTTPS)

```bash
cat <<EOF | kubectl apply -f -
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: argocd-ingress
  namespace: argocd
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    traefik.ingress.kubernetes.io/router.entrypoints: websecure
    # ArgoCD dùng gRPC - cần annotation này
    traefik.ingress.kubernetes.io/router.middlewares: argocd-argocd-server-https-redirect@kubernetescrd
    nginx.ingress.kubernetes.io/ssl-passthrough: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
spec:
  rules:
  - host: argocd.thienduong.info
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: argocd-server
            port:
              number: 80
  tls:
  - hosts:
    - argocd.thienduong.info
    secretName: argocd-tls
EOF
```

### 4.3 Lấy mật khẩu admin ArgoCD

```bash
# Password lần đầu được sinh tự động
kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath="{.data.password}" | base64 -d && echo
```

### 4.4 Tạo Application trên ArgoCD (sync repo Blog_K8S)

```bash
# Cài argocd CLI
curl -sSL -o argocd https://github.com/argoproj/argo-cd/releases/latest/download/argocd-linux-amd64
chmod +x argocd && sudo mv argocd /usr/local/bin/

# Login
argocd login argocd.thienduong.info --username admin --password <password-from-above>

# Tạo Application cho client
argocd app create devops-blog-client \
  --repo https://github.com/ThienDuong2909/Blog_K8S.git \
  --path . \
  --dest-server https://kubernetes.default.svc \
  --dest-namespace default \
  --sync-policy automated \
  --auto-prune \
  --self-heal

# Kiểm tra
argocd app list
argocd app get devops-blog-client
```

---

## Phần 5: Cấu hình Jenkins Credentials

> Jenkins cần các credentials sau để Jenkinsfile hoạt động đầy đủ

### 5.1 Danh sách credentials cần tạo trong Jenkins

| Credential ID            | Type              | Mô tả                                         |
| ------------------------ | ----------------- | --------------------------------------------- |
| `docker-hub-credentials` | Username/Password | Docker Hub login                              |
| `github-access-token`    | Username/Password | GitHub Personal Access Token để push Blog_K8S |
| `API_URL_PROD`           | Secret Text       | `https://api.thienduong.info` (hoặc URL API)  |
| `APP_URL_PROD`           | Secret Text       | `https://blog.thienduong.info`                |
| `sonar-server`           | (System config)   | Cấu hình trong Jenkins > System > SonarQube   |

### 5.2 Tạo GitHub Personal Access Token

1. Vào `GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)`
2. Cấp quyền: `repo` (full control)
3. Copy token
4. Vào Jenkins → Credentials → System → Global → Add Credentials
   - Kind: **Username with password**
   - Username: `ThienDuong2909` (GitHub username)
   - Password: `ghp_xxxx` (token vừa tạo)
   - ID: `github-access-token`

---

## Phần 6: Apply manifests lên K3s lần đầu

```bash
# SSH vào VPS, apply các file manifest
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
kubectl apply -f ingress.yaml

# Kiểm tra trạng thái
kubectl get pods
kubectl get svc
kubectl get ingress

# Xem logs pod nếu có lỗi
kubectl logs -l app=devops-blog-client --follow
```

---

## Phần 7: Checklist hoàn thành

### ✅ Infrastructure

- [ ] K3s cài đặt và chạy (`kubectl get nodes`)
- [ ] cert-manager cài và ClusterIssuer `letsencrypt-prod` Ready
- [ ] ArgoCD cài và truy cập được qua `argocd.thienduong.info`

### ✅ GitOps Repo (Blog_K8S)

- [ ] Repo `ThienDuong2909/Blog_K8S` tồn tại trên GitHub
- [ ] File `deployment.yaml` có dòng `image: thienduong2909/devops-blog-client:latest`
- [ ] ArgoCD App `devops-blog-client` đã được tạo và đang sync

### ✅ Jenkins Pipeline

- [ ] Credential `docker-hub-credentials` đã tạo
- [ ] Credential `github-access-token` đã tạo
- [ ] Credential `API_URL_PROD` đã tạo (Secret Text)
- [ ] Credential `APP_URL_PROD` đã tạo (Secret Text)
- [ ] SonarQube server `sonar-server` đã cấu hình
- [ ] Chạy thử pipeline → tất cả 6 stages pass ✅

### ✅ Kiểm tra end-to-end

- [ ] Push code lên GitHub
- [ ] Jenkins pipeline chạy tự động
- [ ] Docker image push lên Docker Hub
- [ ] File `deployment.yaml` trong `Blog_K8S` được update image tag mới
- [ ] ArgoCD detect thay đổi và deploy lên K3s
- [ ] Truy cập `https://blog.thienduong.info` → App chạy bình thường

---

## 🔧 Troubleshooting thường gặp

### Lỗi: cert-manager không cấp được TLS

```bash
kubectl describe certificate devops-blog-tls -n default
kubectl describe certificaterequest -n default
# Kiểm tra DNS đã trỏ đúng IP VPS chưa
nslookup blog.thienduong.info
```

### Lỗi: ArgoCD không sync được

```bash
argocd app sync devops-blog-client
argocd app get devops-blog-client
# Kiểm tra ArgoCD có quyền truy cập GitHub repo không
```

### Lỗi: Jenkins stage 'Update K8s Manifest' fail

```bash
# Kiểm tra credential github-access-token đúng chưa
# Kiểm tra repo Blog_K8S tồn tại
# Kiểm tra file deployment.yaml có dòng image đúng format
grep 'image: thienduong2909/devops-blog-client' deployment.yaml
```

### Xem logs K3s

```bash
sudo journalctl -u k3s -f
kubectl describe pod <pod-name>
kubectl logs <pod-name> --previous
```
