'use client';

import { useState, useEffect } from 'react';
import { Box, Button, Flex, Heading, Text, VStack, useToast } from '@chakra-ui/react';
import { BrowserProvider, getAddress } from 'ethers';
import { SiweMessage } from 'siwe';
import { useRouter } from 'next/navigation';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export default function Dashboard() {
  const [address, setAddress] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const router = useRouter();

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setAddress(data.address);
        setUser(data.user);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        toast({ title: 'MetaMask not found', status: 'error' });
        return;
      }
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      const address = getAddress(accounts[0]);

      const nonceRes = await fetch('/api/auth/nonce');
      const nonce = await nonceRes.text();

      const network = await provider.getNetwork();
      const message = new SiweMessage({
        domain: window.location.host,
        address,
        statement: 'Sign in with Ethereum to BLNK',
        uri: window.location.origin,
        version: '1',
        chainId: Number(network.chainId),
        nonce,
      });

      const signer = await provider.getSigner();
      const signature = await signer.signMessage(message.prepareMessage());

      const verifyRes = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, signature }),
      });

      if (!verifyRes.ok) {
        const errorData = await verifyRes.json();
        throw new Error(errorData.message || 'Error verifying message');
      }
      
      toast({ title: 'Successfully signed in', status: 'success' });
      fetchUser();
    } catch (e: any) {
      toast({ title: e.message || 'Error connecting', status: 'error' });
    }
  };

  if (loading) {
    return (
      <Box minH="100vh" bg="gray.900" color="white" display="flex" alignItems="center" justifyContent="center">
        <Text fontSize="xl" color="whiteAlpha.700" fontWeight="medium" letterSpacing="widest">
          LOADING...
        </Text>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg="gray.900" color="white" position="relative" overflow="hidden">
      {/* Background Ambient Glow */}
      <Box position="absolute" top="-20%" left="-10%" w="50vw" h="50vw" bg="purple.600" filter="blur(150px)" opacity={0.5} borderRadius="full" pointerEvents="none" />
      <Box position="absolute" bottom="-20%" right="-10%" w="50vw" h="50vw" bg="teal.400" filter="blur(150px)" opacity={0.4} borderRadius="full" pointerEvents="none" />

      <VStack gap={12} align="center" maxW="container.lg" mx="auto" px={6} py={20} position="relative" zIndex={10}>
        
        {/* Title Section */}
        <VStack gap={4}>
          <Heading 
            size="4xl" 
            letterSpacing="0.2em" 
            fontWeight="black" 
            textTransform="uppercase"
            bgGradient="linear(to-r, cyan.400, purple.500, pink.500)"
            bgClip="text"
            dropShadow="0 0 20px rgba(255,255,255,0.5)"
          >
            BLNK
          </Heading>
          <Text fontSize="xl" color="whiteAlpha.800" fontWeight="medium" letterSpacing="widest">
            THE WHITELIST FLYWHEEL
          </Text>
        </VStack>
        
        {!address ? (
          <Button 
            size="xl" 
            h="80px"
            px={12}
            fontSize="2xl"
            fontWeight="bold"
            rounded="full"
            bgGradient="linear(to-r, cyan.400, purple.500)"
            color="white"
            _hover={{ bgGradient: 'linear(to-r, cyan.300, purple.400)', transform: 'scale(1.05)' }}
            transition="all 0.3s ease"
            boxShadow="0 0 30px rgba(159, 122, 234, 0.6)"
            onClick={connectWallet}
          >
            CONNECT TO ENTER
          </Button>
        ) : (
          <VStack gap={10} w="full" align="stretch" maxW="3xl">
            
            {/* Wallet & Coins Glass Panel */}
            <Flex 
              justify="space-between" 
              align="center"
              bg="whiteAlpha.100" 
              backdropFilter="blur(20px)"
              border="1px solid"
              borderColor="whiteAlpha.300"
              p={8} 
              rounded="2xl"
              boxShadow="xl"
            >
              <VStack align="start" gap={1}>
                <Text color="cyan.300" fontSize="sm" fontWeight="bold" textTransform="uppercase" letterSpacing="widest">Wallet Linked</Text>
                <Text fontFamily="monospace" fontSize="xl" fontWeight="semibold">{address.slice(0, 6)}...{address.slice(-4)}</Text>
              </VStack>
              <VStack align="end" gap={1}>
                <Text color="pink.400" fontSize="sm" fontWeight="bold" textTransform="uppercase" letterSpacing="widest">Your Coins</Text>
                <Heading size="2xl" color="white">{user?.coins || 0}</Heading>
              </VStack>
            </Flex>

            {/* Content Grid */}
            <Flex gap={8} direction={{ base: 'column', md: 'row' }}>
              
              {/* Tasks Card */}
              <Box 
                flex={1}
                bgGradient="linear(to-br, whiteAlpha.200, whiteAlpha.50)" 
                backdropFilter="blur(20px)"
                border="1px solid"
                borderColor="whiteAlpha.200"
                p={8} 
                rounded="2xl"
                position="relative"
                overflow="hidden"
                _before={{
                  content: '""',
                  position: 'absolute',
                  top: 0, left: 0, right: 0, h: '4px',
                  bgGradient: 'linear(to-r, cyan.400, blue.500)'
                }}
              >
                <Heading size="lg" mb={2}>Tasks</Heading>
                <Text color="whiteAlpha.800" mb={8}>Complete tasks to earn coins and play the claw machine.</Text>
                
                {user?.twitterLinked ? (
                  <Box p={4} bg="green.500" rounded="lg" color="white" textAlign="center" fontWeight="bold">
                    ✓ Twitter Linked ({user.twitterHandle})
                  </Box>
                ) : (
                  <VStack gap={4}>
                    <Text color="gray.400" fontSize="sm" w="full" textAlign="left">Enter your Twitter handle:</Text>
                    <Flex w="full" gap={2}>
                      <Box as="input" id="twitterInput" placeholder="@handle" bg="blackAlpha.500" color="white" p={3} rounded="md" flex={1} border="1px solid" borderColor="whiteAlpha.300" _focus={{ outline: 'none', borderColor: 'cyan.400' }} />
                      <Button 
                        colorScheme="cyan" 
                        onClick={async () => {
                          const val = (document.getElementById('twitterInput') as HTMLInputElement).value;
                          if (!val) return toast({ title: 'Enter a handle', status: 'warning' });
                          try {
                            const res = await fetch('/api/tasks/twitter', { method: 'POST', body: JSON.stringify({ handle: val }) });
                            const data = await res.json();
                            if (res.ok) {
                              toast({ title: 'Twitter linked! +10 Coins', status: 'success' });
                              setUser({ ...user, twitterLinked: true, twitterHandle: data.handle, coins: data.coins });
                            } else {
                              toast({ title: data.message, status: 'error' });
                            }
                          } catch (e) {
                            toast({ title: 'Error linking Twitter', status: 'error' });
                          }
                        }}
                      >
                        Link
                      </Button>
                    </Flex>
                  </VStack>
                )}
              </Box>

              {/* Referrals Card */}
              <Box 
                flex={1}
                bgGradient="linear(to-br, whiteAlpha.200, whiteAlpha.50)" 
                backdropFilter="blur(20px)"
                border="1px solid"
                borderColor="whiteAlpha.200"
                p={8} 
                rounded="2xl"
                position="relative"
                overflow="hidden"
                _before={{
                  content: '""',
                  position: 'absolute',
                  top: 0, left: 0, right: 0, h: '4px',
                  bgGradient: 'linear(to-r, pink.400, purple.500)'
                }}
              >
                <Heading size="lg" mb={2}>Referrals</Heading>
                <Text color="whiteAlpha.800" mb={8}>Invite friends to earn additional color drops.</Text>
                
                <Box p={4} bg="blackAlpha.500" rounded="lg" border="1px solid" borderColor="whiteAlpha.200" textAlign="center">
                  <Text color="gray.400" fontSize="sm" mb={1} textTransform="uppercase">Your Invite Code</Text>
                  <Text fontWeight="black" fontSize="2xl" color="pink.400" letterSpacing="widest">{user?.referralCode || '------'}</Text>
                </Box>
              </Box>

            </Flex>

            {/* CTA Button */}
            <Box pt={8} pb={12}>
              <Button 
                size="xl" 
                h="100px" 
                w="full"
                fontSize="3xl" 
                fontWeight="black"
                letterSpacing="widest"
                bg="white" 
                color="black" 
                rounded="2xl"
                _hover={{ transform: 'translateY(-4px)', boxShadow: '0 20px 40px rgba(255,255,255,0.2)' }}
                transition="all 0.3s ease"
                onClick={() => router.push('/game')}
              >
                PLAY CLAW MACHINE
              </Button>
            </Box>
          </VStack>
        )}
      </VStack>
    </Box>
  );
}
