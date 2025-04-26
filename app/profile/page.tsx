"use client"

import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Loader2, LogOut, Package, Clock, RefreshCw, CheckCircle, AlertCircle, ExternalLink } from "lucide-react"
import { getUserOrders } from "@/lib/actions"
import type { Order } from "@/lib/types"

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
}

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Status colors and icons
  const statusConfig = {
    Pending: { color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500", icon: Clock },
    "In Review": { color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-500", icon: RefreshCw },
    Processing: { color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-500", icon: Package },
    Completed: { color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500", icon: CheckCircle },
  }

  // Redirect to sign in if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  // Fetch user orders
  useEffect(() => {
    const fetchOrders = async () => {
      if (session?.user?.id) {
        setIsLoading(true)
        try {
          const result = await getUserOrders(session.user.id)
          if (result.success) {
            setOrders(result.orders)
          }
        } catch (error) {
          console.error("Failed to fetch orders:", error)
        } finally {
          setIsLoading(false)
        }
      }
    }

    if (session?.user) {
      fetchOrders()
    }
  }, [session])

  // Handle sign out
  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" })
  }

  if (status === "loading") {
    return (
      <div className="container flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!session) {
    return null // Will redirect to sign in
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <motion.div initial="hidden" animate="visible" variants={fadeIn}>
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row gap-8 mb-8">
            {/* User Profile Card */}
            <Card className="glass-card md:w-1/3">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="relative w-24 h-24">
                    <Image
                      src={session.user.image || "/placeholder.svg?height=96&width=96"}
                      alt={session.user.name || "User"}
                      fill
                      className="rounded-full object-cover border-4 border-background"
                    />
                  </div>
                </div>
                <CardTitle>{session.user.name}</CardTitle>
                <CardDescription>{session.user.email}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Member since</span>
                    <span>
                      {new Date().toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total orders</span>
                    <span>{orders.length}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSignOut} variant="outline" className="w-full">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </CardFooter>
            </Card>

            {/* Orders Tab */}
            <Card className="glass-card md:w-2/3">
              <CardHeader>
                <CardTitle>Your Orders</CardTitle>
                <CardDescription>View and track your order history</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                    <p className="text-muted-foreground mb-4">You haven't placed any orders yet</p>
                    <Button asChild>
                      <Link href="/select">Browse Services</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order ID</TableHead>
                          <TableHead>Service</TableHead>
                          <TableHead>Link</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orders.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell className="font-medium">
                              <Link href={`/track?orderId=${order.order_id}`} className="hover:underline">
                                {order.order_id.substring(0, 8)}...
                              </Link>
                            </TableCell>
                            <TableCell>
                              {order.platform} - {order.service}
                            </TableCell>
                            <TableCell>
                              {order.link ? (
                                <a
                                  href={order.link.startsWith("http") ? order.link : `https://${order.link}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center hover:underline text-primary"
                                >
                                  <span className="truncate max-w-[100px]">
                                    {order.link.replace(/^https?:\/\//, "")}
                                  </span>
                                  <ExternalLink className="ml-1 h-3 w-3" />
                                </a>
                              ) : (
                                <span className="text-muted-foreground">N/A</span>
                              )}
                            </TableCell>
                            <TableCell>{order.quantity.toLocaleString()}</TableCell>
                            <TableCell>${order.total.toFixed(2)}</TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={statusConfig[order.status as keyof typeof statusConfig]?.color}
                              >
                                {(() => {
                                  const StatusIcon =
                                    statusConfig[order.status as keyof typeof statusConfig]?.icon || AlertCircle
                                  return (
                                    <div className="flex items-center">
                                      <StatusIcon className="h-3 w-3 mr-1" />
                                      {order.status}
                                    </div>
                                  )
                                })()}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {new Date(order.created_at).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
