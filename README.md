# 🎫 Massa Autopass - Decentralized Pass & Membership Platform

A fully on-chain, production-ready decentralized application (dApp) built on the Massa blockchain. Massa Autopass enables creators to sell memberships, tickets, and passes, while users can purchase them and receive verifiable PDF certificates - all powered by Massa's Autonomous Smart Contracts (ASCs).

## 📍 Contract Address

**BUILDNET**: `AS1BDUyJj8K4wafPh4Gfz63uVKsoFjoKwLBZePiQKN1PrTcjHZYX`

**YOUTUBE DEMO** : https://youtu.be/qdsY8BB4OV4
**LIVE DEMO** : https://autopass.build.half-red.net

## 🌟 What is Massa Autopass?

Massa Autopass is a decentralized platform that revolutionizes how memberships, tickets, and passes are sold and managed. Built entirely on the Massa blockchain, it leverages Autonomous Smart Contracts to automate subscription renewals, expiry management, and access control - all without any centralized servers or cron jobs.

### Key Innovation

Unlike traditional subscription platforms that require backend servers and scheduled tasks, Massa Autopass uses **Autonomous Smart Contracts** that can schedule future actions on-chain. This means:
- ✅ **Fully Decentralized**: No servers, no admins, no single point of failure
- ✅ **Self-Running**: Auto-renewals and expiries happen automatically on-chain
- ✅ **Transparent**: All logic is verifiable on the blockchain
- ✅ **Unstoppable**: Once deployed, it runs forever

## 🎯 Who Can Use This?

### For Creators/Organizations
- **Gyms & Fitness Centers**: Sell monthly/annual memberships
- **Event Organizers**: Sell tickets for concerts, conferences, workshops
- **Course Creators**: Sell access to online courses and educational content
- **Communities**: Create membership passes for exclusive communities
- **Coaches & Trainers**: Offer subscription-based coaching services
- **Any Business**: Sell time-limited or subscription-based access

### For Users
- **Fitness Enthusiasts**: Buy gym memberships that auto-renew
- **Event Attendees**: Purchase tickets for events
- **Students**: Access courses and receive certificates
- **Community Members**: Join exclusive communities
- **Anyone**: Who wants to buy passes or memberships on-chain

## 🚀 How It Works

### 1. Creator Flow

1. **Connect Wallet**: Creator connects their Massa wallet (Bearby or Massa Station)
2. **Set Profile**: Create a profile with name, logo, description, and social links
3. **Create Pass**: Define pass details:
   - Name and description
   - Type (subscription, one-time, time-limited)
   - Price in MAS tokens
   - Duration (days/hours)
   - Auto-renewal option
   - Max supply (optional)
   - Metadata (image, perks) stored on IPFS
4. **Manage Passes**: View all created passes, see subscribers, track earnings
5. **Issue Certificates**: Issue verifiable PDF certificates to users
6. **Withdraw Earnings**: Withdraw accumulated revenue

### 2. User Flow

1. **Connect Wallet**: User connects their Massa wallet
2. **Discover Passes**: Browse available passes by category, price, duration
3. **View Pass Details**: See full pass information, creator profile, perks
4. **Purchase Pass**: Buy pass with MAS tokens
5. **Auto-Renewal**: Enable/disable automatic renewal
6. **Access Content**: Use `hasAccess()` function to verify access
7. **Receive Certificates**: Download PDF certificates issued by creators
8. **Manage Subscriptions**: View active passes, expiry dates, billing history

### 3. Autonomous Smart Contract Flow

The magic happens automatically:

1. **When User Buys Pass**:
   - Payment is transferred to contract → creator
   - Subscription is created with `startTime` and `expiryTime`
   - A deferred call is scheduled at `expiryTime`

2. **At Expiry Time** (Autonomous):
   - If `autoRenew = true` and user has balance:
     - Charge user again
     - Extend `expiryTime`
     - Schedule next deferred call
   - If `autoRenew = false` or insufficient balance:
     - Mark subscription as expired
     - Stop auto-renewal

3. **Access Verification**:
   - Any system can call `hasAccess(userAddress, passId)`
   - Returns `true` if subscription is active and not expired
   - No external services needed!

## ✨ Features

### Core Features

- **🎫 Pass Creation**: Create subscription passes, one-time tickets, and time-limited passes
- **💰 Payment Processing**: Secure on-chain payments in MAS tokens
- **🔄 Auto-Renewal**: Automated subscription renewals using Massa ASCs
- **📜 Certificate Issuance**: Issue verifiable certificates with PDF download
- **👤 Creator Profiles**: Rich creator profiles with logos and social links
- **📊 Analytics Dashboard**: Track revenue, subscribers, and growth
- **🔍 Discovery**: Search and filter passes by category, price, duration
- **💼 User Dashboard**: Manage subscriptions, view certificates, track activity
- **🎁 Referral System**: Invite friends and earn rewards

### Advanced Features

- **IPFS Storage**: Decentralized metadata storage using Pinata
- **3D UI Effects**: Beautiful 3D card effects and animations
- **Glass Morphism**: Modern glassmorphic design
- **Responsive Design**: Works perfectly on all devices
- **Dark Theme**: Eye-friendly dark theme with gradient accents
- **Smooth Animations**: Framer Motion powered animations
- **Wallet Integration**: Seamless connection with Bearby and Massa Station

## 🛠️ Technology Stack

### Smart Contract
- **AssemblyScript**: Contract language
- **Massa AS SDK**: Massa AssemblyScript SDK
- **Autonomous Smart Contracts**: For scheduling future calls
- **Storage API**: On-chain data storage

### Frontend
- **React 18**: Modern UI framework
- **TypeScript**: Type safety
- **Vite**: Fast build tool
- **Tailwind CSS**: Utility-first styling
- **Framer Motion**: Smooth animations
- **React Router**: Client-side routing
- **jsPDF**: PDF certificate generation
- **Axios**: HTTP client for IPFS
- **React Hot Toast**: Beautiful notifications

### Storage
- **IPFS (Pinata)**: Decentralized metadata storage
- **Massa Blockchain**: On-chain pass and subscription data

## 📦 Installation & Setup

### Prerequisites
- Node.js v18 or higher
- npm or yarn
- Massa wallet (Bearby or Massa Station)
- Pinata account (for IPFS - optional)

### Step 1: Clone Repository
```bash
git clone <repository-url>
cd AUTOPASS
```

### Step 2: Install Dependencies

**Contract:**
```bash
cd contract
npm install
```

**Frontend:**
```bash
cd ../frontend
npm install
```

### Step 3: Configure Environment

**Contract** (`contract/.env`):
```env
WALLET_SECRET_KEY=your_wallet_secret_key_here
```

**Frontend** (`frontend/.env`):
```env
VITE_CONTRACT_ADDRESS=AS1BDUyJj8K4wafPh4Gfz63uVKsoFjoKwLBZePiQKN1PrTcjHZYX
VITE_PINATA_API_KEY=your_pinata_key (optional)
VITE_PINATA_SECRET_KEY=your_pinata_secret (optional)
VITE_JSON_RPC_URL_PUBLIC=https://buildnet.massa.net/api/v2 (optional)
```

### Step 4: Build & Deploy

**Contract (Already Deployed):**
```bash
cd contract
npm run build
npm run deploy
```

**Frontend:**
```bash
cd frontend
npm run build
```

The production build will be in `frontend/dist/` - deploy this to your hosting provider.

## 🎮 Usage Guide

### For Creators

1. **Getting Started**
   - Visit the website
   - Click "Connect Wallet" in the navbar
   - Connect with Bearby or Massa Station

2. **Create Profile**
   - Go to "Creator Dashboard"
   - Click "Profile" tab
   - Fill in:
     - Name
     - Description
     - Logo (upload to IPFS)
     - Social links
   - Click "Save Profile"

3. **Create Your First Pass**
   - Go to "Create Pass" tab
   - Fill in pass details:
     - Name: "Premium Gym Membership"
     - Description: "Full access to all facilities"
     - Category: Select appropriate category
     - Type: Subscription / One-time / Time-limited
     - Price: Enter price in MAS (e.g., 100 MAS)
     - Duration: Enter duration in seconds (e.g., 2592000 for 30 days)
     - Auto-renew: Enable if you want automatic renewals
     - Max Supply: Optional limit
   - Upload pass image (optional)
   - Click "Create Pass"

4. **Manage Passes**
   - View all your passes in "My Passes" tab
   - See subscriber count, revenue, and status
   - Toggle pass active/inactive
   - View pass details page

5. **Issue Certificates**
   - Go to "Certificates" tab in Creator Dashboard
   - Select a pass
   - Enter recipient details:
     - Recipient name
     - Organization name
     - Course/event name
     - Issue date
     - Certificate type
   - Click "Issue Certificate"
   - User can download PDF certificate

6. **Withdraw Earnings**
   - Go to "Earnings" tab
   - View total earnings
   - Click "Withdraw" to transfer funds to your wallet

### For Users

1. **Getting Started**
   - Visit the website
   - Click "Connect Wallet"
   - Connect your Massa wallet

2. **Discover Passes**
   - Go to "Discover" page
   - Browse available passes
   - Use filters to find specific passes:
     - Category
     - Price range
     - Duration
   - Click on a pass to view details

3. **Purchase a Pass**
   - Go to pass detail page
   - Review pass information
   - Click "Buy Pass" or "Subscribe"
   - Approve transaction in wallet
   - Wait for confirmation

4. **Manage Subscriptions**
   - Go to "My Passes" (User Dashboard)
   - View all your active passes
   - See expiry dates and countdown
   - Toggle auto-renewal on/off
   - Cancel auto-renewal if needed

5. **Download Certificates**
   - Go to "Certificates" page
   - View all certificates issued to you
   - Click "Download PDF" to get certificate

6. **Check Access**
   - Your access is verified on-chain
   - Creators can check your access using `hasAccess()` function
   - Access is automatically managed by the smart contract

## 📖 Smart Contract Functions

### Creator Functions

- **`setCreatorProfile(name, description, logoCid, socialLinks)`**
  - Sets creator profile information
  - Stores metadata on IPFS

- **`createPass(name, description, category, passType, price, tokenAddress, durationSeconds, autoRenewAllowed, maxSupply, metadataCid)`**
  - Creates a new pass
  - Returns pass ID

- **`issueCertificate(recipientName, organizationName, courseName, issueDate, certificateType, metadataCid, passId)`**
  - Issues a certificate to a user
  - Verifies issuer has authority

- **`togglePassActive(passId)`**
  - Activates or pauses a pass
  - Only creator can call

- **`withdrawEarnings()`**
  - Withdraws accumulated earnings
  - Transfers to creator wallet

### User Functions

- **`buyPass(passId, autoRenew)`**
  - Purchases a pass
  - Transfers payment
  - Creates subscription
  - Schedules deferred call for expiry

- **`cancelAutoRenew(subId)`**
  - Cancels auto-renewal for a subscription
  - Subscription will expire at end of period

### View Functions (Read-Only)

- **`getPass(passId)`**: Returns pass details
- **`getCreatorProfile(creatorAddress)`**: Returns creator profile
- **`getCertificate(certId)`**: Returns certificate details
- **`getUserSubscriptions(userAddress)`**: Returns user's subscription IDs
- **`getCreatorPasses(creatorAddress)`**: Returns creator's pass IDs
- **`getPassSubscribers(passId)`**: Returns list of subscribers
- **`hasAccess(userAddress, passId)`**: Returns true if user has active access
- **`getEarnings()`**: Returns creator's total earnings

## 🏗️ Architecture

### Layer 1: Frontend (DeWeb)
- Fully hosted on Massa DeWeb (or any static host)
- React-based UI with modern design
- Connects to Massa blockchain via wallet
- Fetches metadata from IPFS

### Layer 2: Smart Contract (Autonomous Engine)
- Single main contract manages everything
- Handles pass registry, subscriptions, payments
- Uses deferred calls for auto-renewal and expiry
- All logic is transparent and on-chain

### Layer 3: Storage
- **On-chain**: Pass configs, subscriptions, creator data
- **IPFS**: Metadata JSON, images, certificate data

## 🔐 Security

- ✅ All transactions are on-chain and verifiable
- ✅ Wallet private keys never leave user's device
- ✅ Smart contract code is open source
- ✅ IPFS metadata is decentralized and immutable
- ✅ Access control enforced by smart contract
- ✅ No centralized servers or databases

## 🌐 Network

Currently deployed on **Massa BUILDNET** (testnet).

**Contract Address**: `AS1BDUyJj8K4wafPh4Gfz63uVKsoFjoKwLBZePiQKN1PrTcjHZYX`

To switch to mainnet:
1. Update provider URLs in `frontend/src/services/contract.ts`
2. Update deployment script in `contract/src/deploy.ts`
3. Deploy contract to mainnet
4. Update contract address in frontend `.env`

## 🎨 Customization

### Styling
- Edit `frontend/src/index.css` for global styles
- Modify Tailwind config in `frontend/tailwind.config.js`
- Update color scheme in CSS variables

### Features
- Add new pages in `frontend/src/pages/`
- Extend contract in `contract/assembly/contracts/main.ts`
- Add new services in `frontend/src/services/`

## 🐛 Troubleshooting

### Wallet Connection Issues
- **Problem**: Wallet not connecting
- **Solution**: 
  - Install Bearby browser extension or Massa Station
  - Refresh the page
  - Check browser console for errors

### Contract Not Found
- **Problem**: "Contract not found" error
- **Solution**: 
  - Verify contract address in `frontend/.env`
  - Ensure you're on BUILDNET network
  - Check contract is deployed

### IPFS Upload Fails
- **Problem**: Metadata upload fails
- **Solution**: 
  - Check Pinata API keys in `.env`
  - Verify API keys are correct
  - Check Pinata account has credits

### Transaction Fails
- **Problem**: Transaction rejected
- **Solution**: 
  - Ensure wallet has enough MAS tokens
  - Check network is BUILDNET
  - Verify contract address is correct

## 📄 License

MIT License - feel free to use this project for your own dApps!

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support & Resources

- **Massa Documentation**: https://docs.massa.net
- **Massa Discord**: Join the community
- **Massa Website**: https://massa.net
- **Issues**: Open an issue on GitHub

## 🎯 Roadmap

- [x] Core pass creation and management
- [x] Auto-renewal system
- [x] Certificate issuance with PDF
- [x] Creator and user dashboards
- [x] IPFS integration
- [x] Wallet integration
- [ ] Multi-token support (ERC-20 tokens)
- [ ] NFT passes
- [ ] Subscription tiers
- [ ] Advanced analytics
- [ ] Mobile app
- [ ] Multi-language support
- [ ] Bundle passes
- [ ] Referral rewards system

## 🎉 Why Massa Autopass?

1. **Fully Decentralized**: No servers, no admins, runs on blockchain
2. **Autonomous**: Auto-renewals happen automatically via ASCs
3. **Transparent**: All logic is on-chain and verifiable
4. **User-Friendly**: Beautiful UI with smooth animations
5. **Production-Ready**: Fully functional and tested
6. **Innovative**: Uses Massa's unique ASC capabilities
7. **Secure**: All transactions are on-chain
8. **Scalable**: Can handle unlimited passes and users

---

**Built with ❤️ on Massa Blockchain**

*Massa Autopass - Where memberships meet blockchain autonomy.*
